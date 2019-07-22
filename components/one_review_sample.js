import React from 'react';
import ResponsiveOrdinalFrame from "semiotic/lib/ResponsiveOrdinalFrame"
const moment = require('moment');
import NameSamples from "./name_samples.js";

export default class OneReviewSample extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        let days = [];
        const formattedMsgs = this.props.issue.messages
          ? this.props.issue.messages.map(
              msg => Object.assign(msg, {date: moment(msg.date).format("YYYY-MM-DD")}))
          : [];
        const formattedPatches = this.props.issue.patch_details
          ? this.props.issue.patch_details.map(
              p => Object.assign(p, {date: moment(p.created).format("YYYY-MM-DD")}))
          : [];
        for (let i = 0; i < 14; i++) {
          const thisDay = moment().subtract(14 - i, "days");
          let lgtms = 0;
          let normal = 0;
          let closed = 0;
          for (let msg of formattedMsgs) {
            if (thisDay.format("YYYY-MM-DD") === msg.date) {
              if (msg.approval) {
                lgtms++;
              } else {
                normal++;
              }
            }
          }

          let patchSets = 0;
          for (let p of formattedPatches) {
            if (thisDay.format("YYYY-MM-DD") === p.date) {
              patchSets++;
            }
          }

          if (this.props.issue.closed && thisDay.format("YYYY-MM-DD") === moment(this.props.issue.modified).format("YYYY-MM-DD")) {
            closed++;
          }

          function isWeekend(d) {
            return d.day() == 6 || d.day() == 0;
          }
          days.push({
            date: isWeekend(thisDay) ? thisDay.format("DDD:ddd") + ":" : thisDay.day() == 1 ? thisDay.format("DDD:ddd") + "/" : thisDay.format("DDD:ddd"),
            lgtms: lgtms,
            normal: normal,
            closed: closed,
            weekend: thisDay.day() == 0 || thisDay.day() == 6,
            patchSets: -patchSets,
          });
        }
        const frameProps = { 
          /* --- Data --- */
          data: days,

          /* --- Size --- */
          size: [0.14 * window.innerWidth,150],
          responsiveWidth: true,

          /* --- Layout --- */
          type: "bar",

          /* --- Process --- */
          oAccessor: "date",
          rAccessor: ["normal", "patchSets", "lgtms", "closed"],
          rExtent: [-5, 10],

          /* --- Customize --- */
          style: (d) => {
            return { fill: this.props.colors[d.rIndex], stroke: "white" };
          },
          oLabel: (d) => {
            if (d[d.length - 1] === ":") {
              // This was a weekend day.
              return <text className="lbl" style={{ fill: "#bbb", fontSize: "9px"}}>S</text>;
            } else if (d[d.length - 1] === "/") {
              return <text style={{transform: "translateX(0px)", fontSize: "9px"}} className="lbl">M</text>;
            }
            return <text style={{transform: "translateX(0px)", fontSize: "9px"}} className="lbl">{d.slice(4, 5)}</text>;
          },
        };
        function fixEmail(email) {
          let at_idx = email.indexOf("@");
          return at_idx === -1 ? email : email.slice(0, email.indexOf("@"))
        }
        return (
          <div className="review-frame">
            <h3>
              {this.props.showOwner && <span className="owner">
                                         {this.props.issue.owner}
                                       </span>}
              <a href={`https://mongodbcr.appspot.com/${this.props.issue.issue}`}>{this.props.issue.subject}
              </a>
            </h3>
            <ResponsiveOrdinalFrame {...frameProps} />
            <div className="reviewers">
              <NameSamples names={this.props.issue.reviewers.map(fixEmail)} />
            </div>
            <style jsx>{`
              .owner {
                display: inline;
                font: 12px sans-serif;
                font-weight: bold;
                padding: 2px 4px;
                margin: 0px 4px 0px 0px;
                vertical-align: middle;
                border-radius: 2px;
                background: #16CC62;
                color: white;
              }
              .reviewers {
                position: absolute;
                top: 161px;
                left: 1px;
                height: 30px;
                width: 24vw;
                overflow: hidden;
              }
              .review-frame {
                position: relative;
                width: 20vw;
                display: inline-block;
                margin: 5px 3px 0px 3px;
                background-color: white;
                border: 1px solid #BABDBE;
                border-radius: 2px;
                box-shadow: 0 1px 1px rgba(0,0,0,0.15);
                padding: 10px 6px 0px 6px;
              }
              h3 {
                font-size: 12px;
                vertical-align: top;
                font-weight: normal;
                height: 30px;
                overflow: hidden;
                display: inline-block;
                margin: 0;
              }
              a {
                color: #4a4f52;
                text-decoration: underline;
              }
              a:hover {
                color: #006cbc;
                text-decoration: underline;
              }
              .lbl {
                transform: translateX(-10px);
                font-size: 8px;
              }
            `}</style>
          </div>
        );
    }
}
