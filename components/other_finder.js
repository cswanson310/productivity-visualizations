import React from 'react';
import NameSamples from './name_samples.js';

function Other(props) {
  return (
    <div>
      <p>{props.name}</p>
    </div>
  );

}

export default class OtherFinder extends React.Component {
  _mounted = false;
  constructor(props) {
    super(props);
    this.state = {
      teamMembers: props.teamMembers.map(name => name + "@10gen.com"),
      startDate: props.startDate,
      pending: true,
      toDisplay: [],
    };
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  componentDidMount() {
    this._mounted = true;
    this.fetchData().then(data => {
      if (data.length > 0) {
        const newData = Object.assign({}, this.state);
        newData.pending = false;
        newData.toDisplay = data;
        if (this._mounted) {
          this.setState(newData);
        }
      }
    });
  }

  async fetchData(userMatch) {
    if (!this.props.db) {
      return [];
    }
    return this.props.db.collection("issues").aggregate([
      {$match: {modified: {$gte: this.state.startDate.toISOString()}}},
      {$match: {owner_email: {$nin: this.state.teamMembers}, reviewers: {$in: this.state.teamMembers}}},
      {$match: {reviewers: {$ne: []}, messages: {$ne: []}}},
      {$group: {_id: "$owner"}},
    ]).toArray();
  }

  render() {
    return <NameSamples names={this.state.toDisplay.map(doc => doc._id)} />;
  }
}

