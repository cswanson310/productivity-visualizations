import React from 'react';
import OneReviewSample from './one_review_sample.js';
const moment = require('moment');

export default class ReviewSamples extends React.Component {
  _isMounted = false;

  constructor(props) {
    super(props);
    this.state = {
      initialized: false,
      user: props.user,
      teamMembers: this.props.teamMembers,
      issues: [],
    };
  }

  async getSampleIssues(db, startDate, user) {
    const kSampleSize = 4;
    const teamEmails = this.state.teamMembers.map(member => member + "@10gen.com");
    const ownerMatch = user === "Outside Team"
    ? {$match: {
        owner_email: {$nin: teamEmails},
        reviewers: {$in: teamEmails}}
      }
    : {$match: {owner_email: user + "@10gen.com"}};
    return db.collection("issues").aggregate([
      {$match: {modified: {$gte: moment().subtract(14, "days").toISOString()}}},
      ownerMatch,
      {$match: {reviewers: {$ne: []}, messages: {$ne: []}}},
      {$sample: {size: kSampleSize}}
    ]).toArray();
  }

  refreshIssues(db, startDate, user) {
    this.getSampleIssues(db, startDate, user).then(issues => {
      if (this._isMounted) {
        let newData = Object.assign({}, this.state);
        newData.issues = issues;
        newData.user = user;
        newData.initialized = true;
        this.setState(newData);
      }
    });
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentDidUpdate(prevProps) {
    if (this.props.db && (prevProps.startDate != this.props.startDate || prevProps.user != this.props.user)) {
      this.refreshIssues(this.props.db, this.props.startDate, this.props.user);
    }
  }

  render() {
    if (!this.state.initialized) {
      if (this.props.db) {
        this.refreshIssues(this.props.db, this.props.startDate, this.props.user);
      }
      return (
        <div>
          <h2>Loading sample reviews...</h2>
        </div>
      );
    }

    const colors = [
      /*
      "#196EE6",
      "#16CC62",
      "#E6B219",
      "#B42626",
      "#1392AB",
      "#E65D19",
      "#116149",
      "#80340E",
      */
      "#20639B",
      "#3CAEA3",
      "#F6D55C",
      "#ED553B",
    ];
    if (this.state.issues.length === 0) {
      return (
        <div>
          <h3>No reviews in the last 14 days</h3>
          <style jsx>{`
            h3 {
              margin: 40px 0 10px 0;
            }
          `}</style>
        </div>
      );
    }
    return (
      <div>
        <div style={{display: "inline-block"}}>
          <h3>Recent Issues</h3>
        </div>
        <div style={{display: "inline-block"}}>
          <ul>
            <li style={{color: colors[0]}}>
              <div
                style={{background: colors[0]}}
                className="color-key"
              >
              </div>
              Review
            </li>
            <li style={{color: colors[1]}}>
              <div
                style={{background: colors[1]}}
                className="color-key"
               >
               </div>
              Patch Set
            </li>
            <li style={{color: colors[2]}}>
              <div
                style={{background: colors[2]}}
                className="color-key"
              >
              </div>
              LGTM
            </li>
            <li style={{color: colors[3]}}>
              <div
                style={{background: colors[3]}}
                className="color-key">
              </div>
              Close
            </li>
          </ul>
        </div>
        <style jsx>{`
          h3 {
            margin: 40px 0 5px 0;
          }
          ul {
            margin: 0 auto;
            padding: 0;
          }
          li {
            list-style-type: none;
            display: inline-block;
            font: 12px sans-serif;
            text-transform: uppercase;
            padding: 4px;
            vertical-align: middle;
          }
          .color-key {
            width: 12px;
            height: 12px;
            vertical-align: middle;
            display: inline-block;
            margin: 4px;
          }
        `}</style>
        <div>
          {this.state.issues.map(
            (issue, idx) => (<OneReviewSample
                               issue={issue}
                               key={issue.issue}
                               colors={colors}
                               showOwner={this.state.user === "Outside Team"}
                             />))}
        </div>
      </div>
    );
  }
}
