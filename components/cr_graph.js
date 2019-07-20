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
import { RadioBox, RadioBoxGroup } from '@leafygreen-ui/radio-box-group';
import Link from 'next/link';


class TeamCRStats extends React.Component {
  _isMounted = false;

  constructor(props) {
    super(props);
    const defaultDays = 14;
    this.state = {
      nodes: [],
      links: [],
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
  }

  teamEmails() {
    return this.state.members.map(n => n + "@10gen.com");
  }

  aggPrefix() {
    const dateMatch = this.state.startDate ? 
          [{$match: {modified: {$gte: this.state.startDate.toISOString()}}}] : [];
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
  async getByReviewer(db) {
    return db.collection('issues')
        .aggregate(this.aggPrefix().concat([
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

  async getBySender(byReviewer, db) {
    this.byReviewer = byReviewer;
    return db.collection('issues')
        .aggregate(this.aggPrefix().concat([
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
    return this.client.auth.loginWithCredential(new AnonymousCredential());
  }

  recompute() {
    this.getByReviewer(this.db).then((res) => this.getBySender(res, this.db)).then(bySender => {
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

      if (bySender.length == 0) {
          d3.select("#chart").append("p").text("No issues found");
          return;
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

      let d3_json = {nodes: nodes, links: links, hovered: null, clicked: null, team: this.state.team, members: this.state.members};
      if (this._isMounted) {
        this.setState(d3_json);
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
    this.client = this.client || Stitch.initializeDefaultAppClient('productivity_viz-mtrvv');
    this.db = this.db || this.client.getServiceClient(RemoteMongoClient.factory, 'productivity_viz').db('codereview');

    this.login().then(() => this.recompute());
  }

  render() {
    if (this.state.nodes.length == 0) {
      return (
        <div id="cr-stats">
          <div id="time-range">
            <h1>Data for: <span id="days-display">30</span> days.</h1>
          </div>
          <div id="chart">
            <p id="click-name"></p>
          </div>
        </div>
      );
    }
    const haveSelection = () => this.state.clicked || this.state.hovered;
    const selected = () => this.state.clicked || this.state.hovered || {};
    const frameProps = { 
      /* --- Data --- */
      nodes: this.state.nodes,
      edges: this.state.links,

      /* --- Size --- */
      size: [500, 500],
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
          const newState = Object.assign({}, this.state);
          newState.hovered = e;
          this.setState(newState);
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
    /*
    d3.selectAll(".node").filter((n) => {
      console.log(n);
      // console.log(n.height);
    });
    */
    return (
      <div id="overall-stats-pane">
        <div id="flow-column">
          <div id="time-select-text">
          </div>
          <div id="time-select">
            <RadioBoxGroup className="radio-box-group-style" size="compact" value={this.state.days + ""} onChange={(e)=> {
              if (!this._isMounted) {
                return;
              }
              let newState = Object.assign({}, this.state);
              newState.days = e.target.value;
              if (e.target.value == "All") {
                newState.startDate = null;
              } else {
                newState.startDate = moment().subtract(Number(e.target.value), "days");
              }
              this.setState(newState);
              this.recompute();
            }}>
              {["All Time", "365", "90", "60", "30", "14", "7"].map((opt, idx) => {
                return (
                  <RadioBox key={idx} value={opt}>
                    {opt === "All Time" ? opt : opt + " days"}
                  </RadioBox>
                );
              })}
            </RadioBoxGroup>
          </div>
          <div id="chart-label">
            <p id="sender-label">
              Sender
            </p>
            <div id="chart-label-line" className={selected().kind || "none"}>
            </div>
            <p id="receiver-label">
              Receiver
            </p>
          </div>
          <div id="network-frame">
            <NetworkFrame {...frameProps} />
          </div>
        </div>
        <div id="detail-pane">
          <AllStats
            db={this.db}
            teamName={this.state.team}
            teamStats={this.state.teamStats}
            startDate={this.state.startDate}
            hovered={selected()} 
            teamMembers={this.state.members}
            kind={selected().kind || "sender"}
           />
          <ReviewSamples
            db={this.db}
            startDate={this.state.startDate}
            user={(selected() || {}).name}
            teamMembers={this.state.members}
          />
        </div>
        <style jsx>{`
          #chart-label {
            margin-top: 30px;
            width: 512px;
            height: 30px;
            position: relative;
          }
          #chart-label-line {
            width: 370px;
            display: inline-block;
            height: 100%;
            background: url("/static/arrow-right.svg") no-repeat;
            transform: rotateY(180deg);
            top: 13px;
            position: absolute;
          }
          #chart-label p {
            display: inline-block;
            font-size: 12px;
          }
          p#sender-label {
            width: 75px;
            text-align: right;
            margin-right: 10px;
          }
          p#receiver-label {
            float: right;
          }
          #overall-stats-pane {
            width: 80vw;
            max-height: 70vh;
            background: #fafbfc;
            margin: 0 auto;
          }
          #chart {
            vertical-align: top;
            font: 13px sans-serif;
          }
          #flow-column {
            width: 600px;
            display: inline-block;
          }
          #detail-pane {
            width: 600px;
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
          #time-range {
            padding-bottom: 20px;padding-bottom: 20px;
            font-family: sans-serif;
            color: #4f4f4f;
            width: 550px;
          }
          #time-select-text {
            padding-right: 15px;
          }
          #time-select-text h1 {
            font-size: 14px;
            transform: translateY(12px);
          }
          #network-frame {
            padding-left: 85px;
            max-width: 600px;
            margin-top: 20px;
            position: relative;
          }
        `}</style>
        <style global jsx>{`
          .label {
            transform: translate(20px, 4px);
            font: 13px sans-serif;
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
