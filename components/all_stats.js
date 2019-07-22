import React from 'react';
import OneStat from './one_stat.js';
import OtherFinder from './other_finder.js';

export default class AllStats extends React.Component {
  _mounted = false;

  constructor(props) {
    super(props);
    this.state = {
      kind: props.kind,
      teamName: props.teamName,
      teamMembers: props.teamMembers,
      teamStats: Object.assign({pending: true}, props.teamStats),
      stats: {
        pending: true,
        outgoing: {
          nPatches: 0,
          nReviews: 5,
          sent: [],
          timeToFirstComment: 0,
          timeToLGTM: 0,
        }
      },
    };
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  updateTeamData() {
    const memberEmails = this.state.teamMembers.map(name => name + "@10gen.com");
    let teamMatch = {$match: {owner_email: {$in: memberEmails}}};
    if (this.props.kind === "receiver") {
      teamMatch = {$match: {reviewers: {$in: memberEmails}}}
    }
    this.fetchData(teamMatch).then(data => {
      if (data.length > 0) {
        const newData = Object.assign({}, this.state);
        newData.teamStats.pending = false;
        newData.kind = this.props.kind;
        newData.teamStats.outgoing = data[0];
        if (this._mounted) {
          this.setState(newData);
        }
      }
    });
  }

  componentDidMount() {
    this._mounted = true;
    this.updateTeamData();
  }

  async fetchData(userMatch) {
    if (!this.props.db) {
      return [{sent: 0}];
    }
    return this.props.db.collection("issues").aggregate([
      {$match: {modified: {$gte: this.props.startDate.toISOString()}}},
      userMatch,
      {$project: {
        firstComment: {
          $arrayElemAt: [
            {$filter: {
              input: "$messages",
              cond: ((!this.props.hovered || this.props.kind === "sender")
                      ? {$ne: ["$$this.sender", "$owner_email"]}
                      : {$eq: ["$$this.sender", this.props.hovered.name + "@10gen.com"]}),
            }},
            0
          ]
        },
        firstLGTM: {$arrayElemAt: [
          {$filter: {
            input: "$messages",
            cond: {$and: [
              ((!this.props.hovered || this.props.kind === "sender")
                ? {$ne: ["$$this.sender", "$owner_email"]}
                : {$eq: ["$$this.sender", this.props.hovered.name + "@10gen.com"]}),
              {$or: [
                {$ne: [-1, {$indexOfCP: ["$$this.text", "LGTM"]}]},
                {$ne: [-1, {$indexOfCP: ["$$this.text", "lgtm"]}]}
              ]},
            ]}
          }},
          0
        ]},
        nPatches: {$size: "$patchsets"},
        nReviews: {$size: "$messages"},
        nComments: 
              ((!this.props.hovered || this.props.kind === "sender")
                ? {$sum: "$patch_details.num_comments"}
                : {$sum: {
                    $map: {
                      input: "$patch_details.files",
                      in: {$let: {
                        vars: {all_files: {$objectToArray: "$$this"}},
                        in: {
                          $sum: {
                            $map: {
                              input: "$$all_files.v",
                              in: {
                                $size: {
                                  $filter: {
                                    input: "$$this.messages",
                                    as: "msg",
                                    cond: {$eq: [
                                      "$$msg.author_email",
                                      this.props.hovered.name + "@10gen.com"
                                    ]},
                                  }
                                }
                              }
                            }
                          }
                        }
                      }}
                    }
                }}),
        changes: {
          files: {$reduce: {
            input: "$patch_details.files",
            initialValue: [],
            in: {$setUnion: [
              "$$value",
              {$let: {
                vars: {
                  arr: {$objectToArray: "$$this"}
                },
                in: "$$arr.k"}
              }
            ]}
          }},
          linesAdded: {
            $avg: {
              $map: {
                input: "$patch_details",
                in: {
                  $sum: {
                    $map: {
                      input: {$objectToArray: "$$this.files"},
                      in: "$$this.v.num_added"
                    }
                  }
                }
              }
            }
          },
          linesRemoved: {
            $avg: {
              $map: {
                input: "$patch_details",
                in: {
                  $sum: {
                    $map: {
                      input: {$objectToArray: "$$this.files"},
                      in: "$$this.v.num_removed"
                    }
                  }
                }
              }
            }
          },
        },
        reviewers: 1,
        issue: 1,
        created: 1,
      }},
      {$addFields: {
        timeToFirstComment: {
          $subtract: [
            {$dateFromString: {dateString: "$firstComment.date"}},
            {$dateFromString: {dateString: "$created"}}
          ]
        },
        timeToLGTM: {
          $subtract: [
            {$dateFromString: {dateString: "$firstLGTM.date"}},
            {$dateFromString: {dateString: "$created"}}
          ]
        }
      }},
      {$group: {
        _id: null,
        sent: {$addToSet: "$issue"},
        nPatches: {$avg: "$nPatches"},
        nReviews: {$avg: "$nReviews"},
        filesChanged: {$avg: {$size: "$changes.files"}},
        linesAdded: {$avg: "$changes.linesAdded"},
        linesRemoved: {$avg: "$changes.linesRemoved"},
        nComments: {$avg: "$nComments"},
        timeToLGTM: {$avg: "$timeToLGTM"},
        timeToFirstComment: {$avg: "$timeToFirstComment"},
      }}
    ]).toArray();
  }

  componentDidUpdate(prevProps) {
    if (this.props.hovered.id != prevProps.hovered.id) {
      const userEmail = this.props.hovered.name + "@10gen.com";
      let match = {$match: {owner_email: userEmail}}
      if (this.props.kind === "receiver") {
        match = {$match: {reviewers: userEmail}};
      }
      this.fetchData(match).then(data => {
        if (data.length > 0) {
          const newData = Object.assign({}, this.state);
          newData.stats.pending = false;
          newData.kind = this.props.kind;
          newData.stats.outgoing = data[0];
          if (this._mounted) {
            this.setState(newData);
          }
        }
      });
    } else if (this.props.teamMembers != prevProps.teamMembers) {
      this.updateTeamData();
    } else if (this.props.startDate != prevProps.startDate) {
      this.updateTeamData();
    }
  }

  render() {
    const teamStats = this.state.teamStats;
    if (this.props.hovered.name && this.state.stats.pending) {
      return (
        <div>
          <p>Loading...</p>
        </div>);
    }
    if (!this.props.hovered.name) {
      return (
        <div>
          <table id="stats-blocks">
            <tbody>
              <tr>
                <OneStat
                  ready={!this.state.teamStats.pending}
                  name="Sent by Members"
                  value={this.state.teamStats.pending ? "--" : this.state.teamStats.outgoing.sent.length}
                  units="issues"
                />
                <OneStat
                  ready={!this.state.teamStats.pending}
                  name="Time to first comment"
                  value={this.state.teamStats.pending ? "--" : this.state.teamStats.outgoing.timeToFirstComment}
                  units="millis"
                />
                <OneStat
                  ready={!this.state.teamStats.pending}
                  name="Time to first LGTM"
                  value={this.state.teamStats.pending ? "--" : this.state.teamStats.outgoing.timeToLGTM}
                  units="millis"
                 />
              </tr>
              <tr>
                <OneStat
                  ready={!this.state.teamStats.pending}
                  name="Number of Patches"
                  value={this.state.teamStats.pending ? "--" : this.state.teamStats.outgoing.nPatches}
                  units="patch sets"
                 />
                <OneStat
                  ready={!this.state.teamStats.pending}
                  name="Number of Reviews"
                  value={this.state.teamStats.pending ? "--" : this.state.teamStats.outgoing.nReviews}
                  units="messages"
                />
                <OneStat
                  ready={!this.state.teamStats.pending}
                  name="Number of Comments"
                  value={this.state.teamStats.pending ? "--" : this.state.teamStats.outgoing.nComments}
                  units="Comments"
                />
              </tr>
              <tr>
                <OneStat
                  ready={!this.state.teamStats.pending}
                  name="Files Changed"
                  value={this.state.teamStats.pending ? "--" : this.state.teamStats.outgoing.filesChanged}
                  units="files"
                 />
                <OneStat
                  ready={!this.state.teamStats.pending}
                  name="Lines Added"
                  value={this.state.teamStats.pending ? "--" : this.state.teamStats.outgoing.linesAdded}
                  units="lines"
                />
                <OneStat
                  ready={!this.state.teamStats.pending}
                  name="Lines Removed"
                  value={this.state.teamStats.pending ? "--" : this.state.teamStats.outgoing.linesRemoved}
                  units="lines"
                />
              </tr>
            </tbody>
          </table>
          <style jsx>{`
            h1 {
              font: 20px sans-serif;
              font-weight: bold;
              text-transform: uppercase;
            }
            .stats-blocks: {
              display: inline-block;
              text-align: top;
            }
          `}</style>
        </div>
      );
    }
    function fixname(username) {
      const dotIndex = username.indexOf(".");
      if (dotIndex === -1) {
        return username;
      }
      return username[0].toUpperCase() + username.slice(1, dotIndex) + " " + username[dotIndex + 1].toUpperCase() + username.slice(dotIndex + 2, username.length);
    }

    return (
      <div>
        <div>
          <h1>{fixname(this.props.hovered.name)}</h1>
          {this.props.hovered.name === "Outside Team" &&
             <OtherFinder
               teamMembers={this.state.teamMembers}
               db={this.props.db}
               startDate={this.props.startDate}
             />}
        </div>
        <table id="stats-blocks">
          <tbody>
            <tr>
              <OneStat
                ready={!this.state.stats.pending}
                name={this.state.kind === "sender" ? "Sent" : "Received" + " by User"}
                value={this.state.stats.outgoing.sent.length}
                total={this.state.teamStats.outgoing.sent.length / this.state.teamMembers.length}
                units="issues"
              />
              <OneStat
                ready={!this.state.stats.pending}
                name="Time to first comment"
                value={this.state.stats.outgoing.timeToFirstComment}
                total={this.state.teamStats.outgoing.timeToFirstComment}
                units="millis"
              />
              <OneStat
                ready={!this.state.stats.pending}
                name="Time to first LGTM"
                value={this.state.stats.outgoing.timeToLGTM}
                total={this.state.teamStats.outgoing.timeToLGTM}
                units="millis"
               />
            </tr>
            <tr>
              <OneStat
                ready={!this.state.stats.pending}
                name="Number of Patches"
                value={this.state.stats.outgoing.nPatches}
                total={this.state.teamStats.outgoing.nPatches}
                units="patch sets"
               />
              <OneStat
                ready={!this.state.stats.pending}
                name="Number of Reviews"
                value={this.state.stats.outgoing.nReviews}
                total={this.state.teamStats.outgoing.nReviews}
                units="messages"
              />
              <OneStat
                ready={!this.state.stats.pending}
                name="Number of Comments"
                value={this.state.stats.outgoing.nComments}
                total={this.state.teamStats.outgoing.nComments}
                units="comments"
              />
            </tr>
            <tr>
              <OneStat
                ready={!this.state.teamStats.pending}
                name="Files Changed"
                value={this.state.stats.outgoing.filesChanged}
                total={this.state.teamStats.outgoing.filesChanged}
                units="files"
               />
              <OneStat
                ready={!this.state.teamStats.pending}
                name="Lines Added"
                value={this.state.stats.outgoing.linesAdded}
                total={this.state.teamStats.outgoing.linesAdded}
                units="lines"
              />
              <OneStat
                ready={!this.state.teamStats.pending}
                name="Lines Removed"
                value={this.state.stats.outgoing.linesRemoved}
                total={this.state.teamStats.outgoing.linesRemoved}
                units="lines"
              />
            </tr>
          </tbody>
        </table>
        <style jsx>{`
          h1 {
            font: 20px sans-serif;
            font-weight: bold;
            margin: 0 5px 0 0;
            display: inline-block;
          }
          .stats-blocks: {
            display: inline-block;
            text-align: top;
          }
        `}</style>
      </div>
    );
  }
}
