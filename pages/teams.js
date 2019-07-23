import React from 'react';
import dynamic from 'next/dynamic';
import Header from '../components/header.js';
import MongoLogoStrip from '../components/mongo_logo_strip.js';
import { useRouter } from 'next/router';
import TeamData from '../components/team_data.js';
import Link from 'next/link';

const DynamicIcon = dynamic(
  () => import('@leafygreen-ui/icon'),
  {ssr: false});

const DynamicButton = dynamic(
  () => import('@leafygreen-ui/button'),
  {ssr: false});

function FakeStat(props) {
  return (
    <div className="stat-wrapper">
      <p className="stat-value">{props.value}</p>
      <p className="label">{props.label}</p>
      <style jsx>{`
        p {
          margin: 1vh 0;
          font-family: sans-serif;
          color: #666666;
        }
        .stat-value {
          font-size: 22px;
        }
        .label {
          font-size: 12px;
        }
      `}</style>
    </div>);
}

function TeamCard(props) {
  return (
    <div className="team-card">
      <div className="team-card-header">
        <div className="team-name-wrap">
          <h2>{props.teamName}</h2>
        </div>
        <div className="person-icon">
          <DynamicIcon glyph="Person" fill="#000000" />
          <span className="team-count">{props.teamMembers.length}</span>
        </div>
      </div>
      <div className="stat-section">
        <div id='stats-table'>
          <table>
            <tbody>
              <tr className="stat-row">
                <td className="one-stat-elem">
                  <FakeStat value="5m" label="Average Duration" />
                </td>
                <td className="one-stat-elem">
                  <FakeStat value="154" label="Lines of Changes" />
                </td>
              </tr>
              <tr className="stat-row">
                <td className="one-stat-elem">
                  <FakeStat value="42" label="Reviews in last 14 days" />
                </td>
                <td className="one-stat-elem">
                  <FakeStat value="TODO" label="Send / Receive Rate" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="lower-bar">
        <Link href={`team?team=${props.teamName}`}>
          <div className="detail-btn-wrap">
            <DynamicButton variant="primary" className="detail-btn" style={{width: "100%", "min-height": "5vh"}}>
              <span className="detail-btn-span">
                See Details
              </span>
          </DynamicButton>
          </div>
        </Link>
      </div>
      <style jsx>{`
        .team-card {
          display: inline-block;
          margin: 1vh 0.5vw;
          width: 20vw;
          min-height: 35vh;
          background: #F5F6F7;
          border: 1px solid #BABDBE;
          box-shadow: 1px 2px 3px rgba(0,0,0,0.15);
        }
        .team-card:first-child {
          margin-left: 0;
        }
        .team-card:last-child {
          margin-right: 0;
        }
        .table-row {
          display: table-row;
        }
        .table-cell {
          display: table-cell;
        }
        .person-icon {
          float: right;
          padding-right: 1vw;
          margin-top: 1.5vh;
          display: inline-block;
          transform: translateY(2px);
        }
        .team-name-wrap {
          display: inline-block;
          white-space: nowrap;
          max-width: 15vw;
          overflow: hidden;
          text-overflow: ellipsis;
          padding: 1.5vh 1vw;
        }
        .team-card-header h2 {
          font-size: 21px;
          font-family: Akzidenz-Grotesk, Helvetica, sans-serif;
          text-transform: capitalize;
          text-overflow: ellipsis;
          display: inline-block;
          font-weight: 300;
          margin: 0;
          color: #666666;
        }
        .team-count {
          font-family: Akzidenz-Grotesk, Helvetica, sans-serif;
          display: inline-block;
          font-size: 16px;
          padding: 4px;
          color: #666666;
        }
        .team-card-header {
          min-height: 6vh;
          max-height: 30px;
          background-color: #fff;
          border-bottom: 1px solid #d7dbdb;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .stat-section {
          min-height: 21vh;
          background-color: #fff;
          border-bottom: 1px solid #d7dbdb;
        }
        .one-stat-elem {
          padding: 1vh 1vw;
          line-height: normal;
        }
        .stat-row {
          line-height: 7vh;
        }
        .lower-bar {
          min-height: 6vh;
          vertical-align: middle;
          text-align: center;
        }
        .detail-btn-wrap {
          width: 17vw;
          min-height: 4vh;
          margin: 0;
          margin-top: 1.5vh;
          padding: 0 1vw;
        }
        .detail-btn-span {
          width: 100%;
          text-align: center;
        }
      `}</style>
    </div>);
}

export default class Teams extends React.Component {
  static async getInitialProps(router) {
    return router.query;
  }

  constructor(props) {
    super(props);
    this.state = {teams: TeamData};
  }

  render() {
    console.log(this.state);
    let inSectionsOfFour = [];
    const allTeamNames = Object.keys(this.state.teams);
    for (let i = 0; i < allTeamNames.length; ++i) {
      if (i % 4 === 0) {
        inSectionsOfFour.push([]);
      }
      inSectionsOfFour[inSectionsOfFour.length - 1].push(allTeamNames[i]);
    }
    return (
        <div>
          <MongoLogoStrip />
          <div className="overall-team-cards-block">
            <h1 id="team-text-header">Teams</h1>
            <ul>
              <li className="active">Core DB Eng</li>
              <li>Test</li>
              <div className="secret-underline"></div>
            </ul>
            {inSectionsOfFour.map((groupOfFourTeams, i) => {
              return (
                <div className="four-teams-row table-row" key={i}>
                  {groupOfFourTeams.map((team, idx) => {
                    return <TeamCard key={4*i + idx} teamName={team} teamMembers={this.state.teams[team]} />
                  })}
                </div>);
            })}
          </div>
          <style jsx>{`
            h1 {
              font-family: Akzidenz-Grotesk, Helvetica, sans-serif;
              font-size: 26px;
              font-weight: 400;
              color: #474D50;
              padding: 1vh 0;
              margin: 2vh 0;
              margin-bottom: 1vh;
            }
            ul {
              position: relative;
              padding: 0;
              width: 83vw;
              height: 40px;
              margin: 0;
              display: table-cell;  // I don't know why this is important, but it prevents an otherwise stubborn right margin
            }
            ul .secret-underline {
              position: absolute;
              top:27px;
              z-index: -12;
              height: 3px;
              width: 100%;
              border-bottom: 3px solid #DCDCDC;
            }
            li {
              min-width: 10vw;
              padding: 7px 1vw;
              display: inline-block;
              text-align: center;
              border-bottom: 3px solid #DCDCDC;
              font-family: Akzidenz-Grotesk, Helvetica, sans-serif;
              font-size: 14px;
              color: #BABDBE;
              list-style-type: none;
            }
            li.active {
              border-bottom: 3px solid #37B166;
              color: #767676;
              font-weight: bold;
            }
            .overall-team-cards-block {
              margin-left: 7vw;
              margin-right: 3vw;
              width: 87vw;
            }
            .table-row {
              display: table-row;
            }
            .table-cell {
              display: table-cell;
            }
          `}</style>
        </div>
    );
  }
}

