import React from 'react';
import dynamic from 'next/dynamic';
import Header from '../components/header.js';
import { useRouter } from 'next/router';

function Square(props) {
  return (
    <button className="square" onClick={props.onClick}>
      {props.value}
    <style jsx>{`
      .square {
        background: #fff;
        border: 1px solid #999;
        float: left;
        font-size: 24px;
        font-weight: bold;
        line-height: 34px;
        height: 34px;
        margin-right: -1px;
        margin-top: -1px;
        padding: 0;
        text-align: center;
        width: 34px;
      }

      .square:focus {
        outline: none;
      }
    `}</style>
    </button>
  );
}

class Board extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      squares: new Array(9).fill(null),
      xIsNext: true,
    };
  }

  handleClick(i) {
    let newSquares = this.state.squares.slice();
    newSquares[i] = this.state.xIsNext ? "X" : "O";
    this.setState({squares: newSquares, xIsNext: !this.state.xIsNext});
  }

  renderSquare(i) {
    return <Square value={this.state.squares[i]} onClick={() => this.handleClick(i)}/>;
  }

  render() {
    const status = `Next player: ${this.state.xIsNext ? "X" : "O"}`;

    return (
      <div>
        <div className="status">{status}</div>
        <div className="board-row">
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
        </div>
        <div className="board-row">
          {this.renderSquare(3)}
          {this.renderSquare(4)}
          {this.renderSquare(5)}
        </div>
        <div className="board-row">
          {this.renderSquare(6)}
          {this.renderSquare(7)}
          {this.renderSquare(8)}
        </div>
      <style jsx>{`
        .board-row:after {
          clear: both;
          content: "";
          display: table;
        }

        .status {
          margin-bottom: 10px;
        }
      `}</style>
      </div>
    );
  }
}

class Game extends React.Component {
  render() {
    return (
      <div className="game">
        <div className="game-board">
          <Board />
        </div>
        <div className="game-info">
          <div>{/* status */}</div>
          <ol>{/* TODO */}</ol>
        </div>
      <style jsx>{`
        .game {
          display: flex;
          flex-direction: row;
        }

        .game-info {
          margin-left: 20px;
        }

        ol, ul {
          padding-left: 30px;
        }
      `}</style>
      <style global jsx>{`
        body {
          font: 14px "Century Gothic", Futura, sans-serif;
          margin: 20px;
        }

        .kbd-navigation .square:focus {
          background: #ddd;
        }
      `}</style>
      </div>
    );
  }
}

const DynamicCRStats = dynamic(
  () => import('../components/cr_graph.js'),
  {ssr: false});

class Page extends React.Component {
  static async getInitialProps(router) {
    console.log(router.query);
    return {};
  }

  render() {
    return (
      <div>
        <Header />
        <DynamicCRStats />
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

// ========================================


export default Page;
