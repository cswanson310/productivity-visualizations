import React from 'react';
import dynamic from 'next/dynamic';
import Header from '../components/header.js';
import { useRouter } from 'next/router';

const DynamicCRStats = dynamic(
  () => import('../components/cr_graph.js'),
  {ssr: false});

export default class About extends React.Component {
  static async getInitialProps(router) {
    console.log(router.query.days);
    return router.query;
  }

  constructor(props) {
    super(props);
    console.log("constructor");
    console.log(props);
    this.state = props;
  }

  render() {
    return (
        <div>
          <Header />
          <DynamicCRStats days={this.state.days}/>
        <style global jsx>{`
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
