import React from 'react';
import dynamic from 'next/dynamic';
import Header from '../components/header.js';
import MongoLogoStrip from '../components/mongo_logo_strip.js';
import { useRouter } from 'next/router';
import TeamData from '../components/team_data.js';

const DynamicCRStats = dynamic(
  () => import('../components/cr_graph.js'),
  {ssr: false});

const DynamicIcon = dynamic(
  () => import('@leafygreen-ui/icon'),
  {ssr: false});

export default class Team extends React.Component {
  static async getInitialProps(router) {
    return router.query;
  }

  constructor(props) {
    super(props);
    this.state = {members: TeamData[props.team], team: props.team};
  }

  render() {
    return (
        <div>
          <MongoLogoStrip />
          <Header team={this.state.team}/>
          <div id="team-banner">
            <h1>
              {this.state.team}
            </h1>
            <span className="person-icon">
              <DynamicIcon glyph="Person" fill="#000000" />
            </span>
            <span id="team-count">{this.state.members.length}</span>
          </div>
          <DynamicCRStats team={this.state.team} members={this.state.members}/>
        <style jsx>{`
          .person-icon {
            padding-left: 8px;
            display: inline-block;
            transform: translateY(2px);
          }
          #team-banner h1 {
            font-size: 24px;
            font-weight: medium;
            font: Akzidenz-Grotesk;
            text-transform: capitalize;
            display: inline-block;
            padding-bottom: 2vh;
            margin: 0px 0px 0px 7vw;
          }
          #team-count {
            display: inline-block;
            font-size: 16px;
            padding: 4px;
            color: #666666;
          }
          @font-face {
            font-family: 'AkzidGroStd';
            src: local('./static/fonts/AkzidGroStdBol.otf'),
          }
        `}</style>
        <style dangerouslySetInnerHTML={{__html: `
          @font-face {
            font-family: 'AkzidGroStd';
            src: local('./static/fonts/AkzidGroStdBol.otf'),
          }
        }
        `}}/>
        <style global jsx>{`
          @font-face {
            font-family: 'AkzidGroStd';
            src: local('./static/fonts/AkzidGroStdBol.otf'),
          }
          body {
            padding: 0;
            margin: 0;
            background: #fafbfc;
            font-family: AkzidGroStd, Helvetica;
          }
          .frame {
            font-family: Helvetica, Arial, sans-serif;
            font-size: 0.8em;
          }

          .axis-baseline {
            stroke: #ddd;
          }

          .tick,
          .axis-tick path {
            stroke: #ddd;
          }

          .uncertainty_cone{
            transform:none;
            fill:#de4b8b;
            fill-opacity:0.20;
          }

          circle.frame-hover {
            stroke: #aaa;
            r: 4;
          }
        `}</style>
        </div>
    );
  }
}
