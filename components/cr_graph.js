import NetworkFrame from 'semiotic/lib/NetworkFrame';
const {
    Stitch,
    RemoteMongoClient,
    AnonymousCredential
} = require('mongodb-stitch-browser-sdk');
const moment = require('moment');
var d3 = require("d3");
import AllStats from './all_stats.js';
import ReviewSamples from './review_samples.js';
import React from 'react';
import { TimeSelector, TimeOption } from './time_select.js';
import Link from 'next/link';

const client = Stitch.initializeDefaultAppClient('productivity_viz-mtrvv');

class TeamCRStats extends React.Component {
  _isMounted = false;

  constructor(props) {
    super(props);
    const defaultDays = 14;
    this.state = {
      nodes: [],
      links: [],
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      team: props.team,
      members: props.members,
      teamStats: {
        bySender: [],
        byReviewer: [],
      },
      hovered: null,
      clicked: null,
      days: defaultDays,
      startDate: new Date(moment().subtract(defaultDays, "days")),
    };
    const originalOnResize = window.onresize;
    window.onresize = () => {
      this.setState(Object.assign(this.state,
                                  {
                                    windowWidth: window.innerWidth,
                                    windowHeight: window.innerHeight
                                  }));
      if (originalOnResize) {
        originalOnResize();
      }
    };
  }

  teamEmails() {
    return this.state.members.map(n => n + "@10gen.com");
  }

  aggPrefix(startDate) {
    const dateMatch = startDate ? 
          [{$match: {modified: {$gte: startDate.toISOString()}}}] : [];
    return dateMatch.concat([
      {$match: {$or: [
        {owner_email: {$in: this.teamEmails()}},
        {reviewers: {$in: this.teamEmails()}}]}
      },
      {$match: {reviewers: {$ne: []}, messages: {$ne: []}}},
      {$unwind: "$reviewers"},
      {$addFields: {owner_email: {$cond: [{$in: ["$owner_email", this.teamEmails()]}, "$owner_email", "Outside Team"]}}},
      {
        $addFields: {
          reviewers:
            {$cond: [{$in: ["$reviewers", this.teamEmails()]}, "$reviewers", "Outside Team"]}
        }
      },
      {$match: {$or: [{owner_email: {$ne: "Outside Team"}}, {reviewers: {$ne: "Outside Team"}}]}}
    ]);
  }
  async getByReviewer(db, startDate) {
    return db.collection('issues')
        .aggregate(this.aggPrefix(startDate).concat([
            {$group: {_id: {sender: "$owner_email", reviewer: "$reviewers"}, count: {$sum: 1}}},
            {
              $group: {
                  _id: "$_id.reviewer",
                  incoming: {$push: {sender: "$_id.sender", count: "$count"}}
              }
            },
            {$addFields: {total_incoming: {$sum: "$incoming.count"}}},
            {$sort: {total_incoming: -1}}
        ]))
        .toArray();
  }

  async getBySender(byReviewer, db, startDate) {
    this.byReviewer = byReviewer;
    return db.collection('issues')
        .aggregate(this.aggPrefix(startDate).concat([
            {$group: {
              _id: {sender: "$owner_email", reviewer: "$reviewers"},
              count: {$sum: 1},
              issue: {$first: "$issue"}
            }},
            {$group: {
              _id: "$_id.sender",
              targets: {$push: {reviewer: "$_id.reviewer", count: "$count"}},
              issues: {$addToSet: "$issue"}
            }},
            {$addFields: {total_sent: {$sum: "$targets.count"}}},
            {$sort: {total_sent: -1}}
        ]))
        .toArray();
  }

  async login() {
    return client.auth.loginWithCredential(new AnonymousCredential());
  }

  recompute(newStartDate, newDays) {
    newStartDate = newStartDate || this.state.startDate;
    this.getByReviewer(this.db, newStartDate)
        .then(res => this.getBySender(res, this.db, newStartDate)).then(bySender => {
          function fixEmail(email) {
            let at_idx = email.indexOf("@");
            return at_idx === -1 ? email : email.slice(0, email.indexOf("@"))
          }

          const byReviewer = this.byReviewer;
          this.state.teamStats = Object.assign(this.state.teamStats, {
            byReviewer: byReviewer.map(rev => Object.assign(rev, {_id: fixEmail(rev._id)})),
            bySender: bySender
          });

          function isTeamMember(email) {
              return this.state.members.indexOf(fixEmail(email)) !== -1;
          }

          const colors = [
            "#196EE6",
            "#E6B219",
            "#E6196E",
            "#19C3E6",
            "#116149",
            "#E65D19",
            "#1392AB",
            "#80340E",
            "#ABABAB",
            "#94640A",
            "#AC0F0F",
            "#464C4F",
            "#EF4C4C",
            "#1392AB",
            "#734EFA",
            "#8DE8B3",
            "#E65D19",
            "#1392AB",
            "#80340E",
            "#ABABAB",
            "#94640A",
            "#AC0F0F",
            "#464C4F",
            "#EF4C4C",
            "#1392AB",
            "#734EFA",
            "#8DE8B3",
          ];
          let nodes = [];
          let numNodes = 0;
          let links = [];

          function displayName(user) {
            const dotIndex = user.indexOf(".");
            if (dotIndex === -1) {
              return user;
            }
            return user[0].toUpperCase() + user.slice(1, dotIndex);
          }

          for (let top_sender of bySender) {
              for (let target of top_sender.targets) {
                  links.push({
                    source: numNodes,
                    value: target.count,
                    target: fixEmail(target.reviewer)
                  });
              }
              const color = colors[numNodes];
              nodes.push({
                  id: numNodes,
                  kind: "sender",
                  name: fixEmail(top_sender._id),
                  displayName: displayName(fixEmail(top_sender._id)),
                  color: color,
                  node: numNodes++
              });
          }

          let reviewer_node_map = {};
          for (let top_reviewer of this.byReviewer) {
              nodes.push({
                  id: numNodes,
                  kind: "receiver",
                  name: fixEmail(top_reviewer._id),
                  displayName: displayName(fixEmail(top_reviewer._id)),
                  color: colors[numNodes],
                  node: numNodes
              });
              reviewer_node_map[fixEmail(top_reviewer._id)] = numNodes++;
          }
          for (let link of links) {
              link.target = reviewer_node_map[link.target];
          }

          let d3_json = {
            nodes: nodes,
            links: links,
            hovered: null,
            clicked: null,
            team: this.state.team,
            members: this.state.members,
            startDate: newStartDate || this.state.startDate,
            days: newDays || this.state.days
          };
          if (this._isMounted) {
            this.setState(Object.assign(this.state, d3_json));
          }
        });
  }

  componentDidUpdate(prevProps) {
    if (this.props.team != prevProps.team) {
      let newState = Object.assign({}, this.state);
      newState.team = this.props.team;
      newState.members = this.props.members;
      this.setState(newState);
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentDidMount() {
    this._isMounted = true;
    this.db = this.db || client
                             .getServiceClient(RemoteMongoClient.factory,
                                               'productivity_viz')
                             .db('codereview');

    this.login().then(() => this.recompute(this.state.startDate, this.state.days));
  }

  render() {
    const haveSelection = () => this.state.clicked || this.state.hovered;
    const selected = () => this.state.clicked || this.state.hovered || {};
    const frameProps = { 
      /* --- Data --- */
      nodes: this.state.nodes,
      edges: this.state.links,

      /* --- Size --- */
      size: [this.state.windowWidth * 0.35, this.state.windowHeight * 0.5],
      margin: {right: 130},

      /* --- Layout --- */
      networkType: { type: "sankey", nodePaddingRatio: 0.2 },

      /* --- Process --- */
      nodeIDAccessor: "id",
      sourceAccessor: "source",
      targetAccessor: "target",

      /* --- Draw --- */
      edgeWidthAccessor: "value",

      /* --- Customize --- */
      nodeStyle: (e) => {
        let opacity = 0.9;
        let color = e.color;
        if (haveSelection()) {
          function targetIsConnected() {
            if (e.kind == "receiver") {
              return e.targetLinks.filter(link => link.source.id == selected().id).length > 0;
            }
            return e.sourceLinks.filter(link => link.target.id == selected().id).length > 0;
          }
          if (e.id === selected().id || targetIsConnected()) {
            color = "#16CC62";
            opacity = 0.9;
          } else {
            opacity = 0.2;
          }
        }
        return {background: color, stroke: color, fill: color, fillOpacity: opacity, strokeOpacity: opacity};
      },
      renderKey: (datapoint, index) => {
        return datapoint;
      },
      // canvasNodes: () => true,
      canvasEdges: () => true,
      edgeStyle: (e) => {
        const opacity = (e.source.id === selected().id || e.target.id === selected().id) ? 0.8 : 0.2;
        const color = (e.source.id === selected().id || e.target.id === selected().id) ? "#16CC62" : "#000";
        return {fill: color, stroke: "#fff", fillOpacity: opacity, strokeOpacity: opacity};
      },

      /* --- Interact --- */
      hoverAnnotation: true,
      tooltipContent: (x) => {
        let translateX = 50;
        if (x.kind === "receiver") {
          translateX = -(translateX + 100);
        }

            // transform: translateX(-50%) translateY(5px);
        return <p className="hover-text tooltip-content" style={{transform: `translateX(${translateX}%) translateY(-30px)`}}>{x.value}</p>;
      },
      customHoverBehavior: (e) => {
        if (e && this._isMounted) {
          this.setState(Object.assign(this.state, {hovered: e}));
        }
      },
      customClickBehavior: (e) => {
        if (e && this._isMounted) {
          const newState = Object.assign({}, this.state);
          if (e.id == (this.state.clicked || {}).id) {
            // They clicked on the one they already had selected.
            newState.clicked = null;
            newState.hovered = null;
          } else {
            newState.clicked = e;
          }
          this.setState(newState);
        }
      },

      /* --- Annotate --- */
      nodeLabels: n => {
        if (n.id === selected().id) {
          return <text className={`label selected ${n.kind}`} key={`${n.id}-${this.state.days}`}>{n.displayName}</text>
        }
        return <text className={`label ${n.kind}`} key={`${n.id}-${this.state.days}`}>{n.displayName}</text>
      }
    };
    const onTimeRangeChange = e => {
      if (!this._isMounted) {
        return;
      }
      let newDays;
      let newStartDate;
      if (e.target.value == "All") {
        newDays = e.target.value;
        newStartDate = null;
      } else {
        newDays = Number(e.target.value);
        newStartDate = new Date(moment().subtract(newDays, "days"));
      }
      this.recompute(newStartDate, newDays);
    }

    return (
      <div id="overall-stats-pane">
        <div id="flow-column">
          <div id="time-select">
            <TimeSelector
              value={this.state.days}
              onChange={onTimeRangeChange}>
              {["All Time", "365", "90", "60", "30", "14", "7"].map((opt, idx) => {
                return (<TimeOption key={idx} value={opt}>
                          <div className={this.state.days == opt ? "time-opt checked" : "time-opt"}>
                            <p>
                              {opt === "All Time" ? opt : opt + " days"}
                            </p>
                          </div>
                        </TimeOption>
                );
              })}
            </TimeSelector>
          </div>
          <div id="chart-label">
            <table>
              <tbody>
                <tr>
                  <td id="sender-label">
                    <p>
                      Sender
                    </p>
                  </td>
                  <td id="chart-label-line">
                    <div className={selected().kind || "none"}>
                    </div>
                  </td>
                  <td id="receiver-label-text">
                    <p>
                      Receiver
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div id="network-frame">
            {this.state.nodes.length
              ? <NetworkFrame {...frameProps} />
              : <h3 id="none-found">
                  No issues Found For This Range
                </h3>
            }
          </div>
        </div>
        <div id="detail-pane">
          <AllStats
            db={this.db}
            teamName={this.state.team}
            teamStats={this.state.teamStats}
            startDate={this.state.startDate}
            hovered={this.state.clicked || this.state.hovered}
            teamMembers={this.state.members}
            kind={selected().kind || "sender"}
           />
          <ReviewSamples
            db={this.db}
            startDate={this.state.startDate}
            user={selected().name}
            selected={this.state.clicked || this.state.hovered}
            teamMembers={this.state.members}
          />
        </div>
        <style jsx>{`
          #chart-label table {
            margin-top: 3vh;
            height: 3vh;
            position: relative;
            width: ${(this.state.windowWidth / 2.3) - 60}px;
          }
          .time-opt {
            display: table-cell;
          }
          .time-opt p {
            margin: 0;
            font-size: 12px;
            text-align: center;
            vertical-align: middle;
            display: inline-block;
            color: #464c4f;
          }
          .time-opt.checked p {
            color: black;
            font-weight: bold;
          }
          #chart-label-line {
            width: ${(this.state.windowWidth/ 3.1) - 100}px;
            display: inline-block;
            height: 100%;
            background: url("/static/arrow-right.svg") no-repeat;
            transform: rotateY(180deg);
            top: 1.3vh;
            position: absolute;
          }
          #chart-label p {
            display: inline-block;
            font-size: 11px;
            margin: 0;
          }
          #sender-label {
            width: 6vw;
            text-align: right;
            padding-right: 10px;
          }
          #receiver-label-text {
            width: 6vw;
            padding-left: 10px;
          }
          #overall-stats-pane {
            max-height: 70vh;
            background: #fafbfc;
            margin-left: 7vw;
          }
          #chart {
            vertical-align: top;
            font: 13px sans-serif;
          }
          #flow-column {
            width: 42vw;
            display: inline-block;
          }
          #detail-pane {
            width: 48vw;
            display: inline-block;
            vertical-align: top;
          }
          .node rect {
            fill-opacity: .9;
            shape-rendering: crispEdges;
            stroke-width: 0;
          }
          .node text {
            text-shadow: 0 1px 0 #fff;
          }
          .link {
            fill: none;
            stroke: #000;
            stroke-opacity: .2;
          }
          #network-frame {
            padding-left: 7vw;
            max-width: 40vw;
            margin-top: 2vh;
            position: relative;
          }
        `}</style>
        <style global jsx>{`
          .label {
            transform: translate(20px, 4px);
            font: 11px sans-serif;
            stroke-opacity: .3;
          }
          .label.sender {
            transform: translate(-15px, 4px);
            text-anchor: end;
          }
          .label.selected {
            font-size: 18px;
            font-weight: 500;
            stroke-opacity: .1;
            fill: #16CC62;
          }
          .tooltip-content {
            position: absolute;
            color: #464c4f;
            padding: 10px;
            z-index: 100;
            min-width: 5px;
          }
        `}</style>
      </div>
    );
  }
}

export default TeamCRStats;
