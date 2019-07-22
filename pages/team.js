import React from 'react';
import dynamic from 'next/dynamic';
import Header from '../components/header.js';
import { useRouter } from 'next/router';

const DynamicCRStats = dynamic(
  () => import('../components/cr_graph.js'),
  {ssr: false});

const kAllTeams = {
    query: [
        "ian.boros",
        "martin.neupauer",
        "samuel.mercier",
        "justin.seyster",
        "misha.ivkov",
        "david.storch",
        "jacob.evans",
        "pawel.terlecki",
        "charlie.swanson",
        "george.wangensteen",
        "xinhao.zhang",
        "james.wahlin",
        "nicholas.zolnierz",
        "davis.haupt",
        "ted.tuckman",
        "bernard.gorman",
        "arun.banala",
        "anton.korshunov"
    ],
    sharding: [
        "kaloian.manassiev",
        "jason.zhang",
        "jamie.heppenstall",
        "alex.taskov",
        "blake.oler",
        "esha.maharishi",
        "jack.mulrow",
        "janna.golden",
        "matthew.saltz",
        "misha.tyulenev",
        "randolph",
        "kevin.pulo",
        "lamont.nelson",
    ],
    replication: [
        "tess.avitabile",
        "judah.schvimer",
        "jason.chan",
        "lingzhi.deng",
        "matthew.russotto",
        "pavithra.vetriselvan",
        "samy.lanka",
        "siyuan.zhou",
        "suganthi.mani",
        "vessy.ratcheva",
        "william.schultz",
        "allison.easton",
        "vishnu.kaushik",
        "medha.potluri",
    ],
    serviceArch: [
        "jason.carey",
        "ben.caimano",
        "mathias.stearn",
    ],
    storageEngines: [
        "michael.cahill",
        "alexander.gorrod",
        "vamsi.krishna",
        "donald.anderson",
        "keith.bostic",
        "luke.chen",
        "alex.cameron",
        "sasha.fedorova",
        "sue.loverso",
        "sulabh.mahajan",
        "luke.pearson",
        "haribabu.kommi",
    ],
    execution: [
        "eric.milkie",
        "geert.bosh",
        "benety.goh",
        "danel.gottlieb",
        "dianna.hohensee",
        "gregory.wlodarek",
        "louis.williams",
        "maria.vankeulen",
        "xiangyu.yao",
    ],
    security: [
        "acm",
        "spencer.jackson",
        "jonathan.reams",
        "mark.benvenuto",
        "sara.golemon",
        "shreyas.kalyan",
    ],
    devTools: [
        "acm",
        "adam",
        "billy.donahue",
        "gabirel.russell",
        "henrik.edin",
        "matthew.robinson",
    ],
    triageRelease: [
        "kelsey.schubert",
        "bruce.lucas",
        "danny.hatcher",
        "eric.sedor",
    ],
};

const DynamicIcon = dynamic(
  () => import('@leafygreen-ui/icon'),
  {ssr: false});

export default class Team extends React.Component {
  static async getInitialProps(router) {
    return router.query;
  }

  constructor(props) {
    super(props);
    this.state = {members: kAllTeams[props.team], team: props.team};
  }

  render() {
    return (
        <div>
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
            margin-left: 7vw;
            text-transform: capitalize;
            display: inline-block;
            padding-bottom: 20px;
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
