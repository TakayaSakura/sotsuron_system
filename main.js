const startTime = Date.now();
const { parse, traverse } = require("regexp-tree");
// const { Disjunction } = require("./Disjunction");

const regex = /(1*)*/; // 正規表現を入力

function removeLastDigit(regexStr) {
  const lastChar = regexStr[regexStr.length - 1];

  if (/\d/.test(lastChar)) {
    //最後の余分な文字を削除（数字のみ）
    return regexStr.slice(0, -1);
  }
  return regexStr;
}
const modifiedStr = removeLastDigit(regex);

const ast = parse(modifiedStr);

let AutomatonArray = [];
let foundDisjunction = false;
let foundRepetition = false;

let disjunctionNode = null;
let RepetitionNode = null;
let Node2 = null;

function checkIDA(ast) {
  let found = false;

  traverse(ast, {
    //IDA構造の確認
    Alternative(path) {
      const expressions = path.node.expressions;

      if (expressions.length === 2) {
        const firstRepetition = expressions[0];
        const secondRepetition = expressions[1];
        if (
          firstRepetition.type === "Repetition" &&
          secondRepetition.type === "Repetition" &&
          firstRepetition.expression.value === secondRepetition.expression.value
        ) {
          found = true;
        }
      }
    },
  });

  return found;
}

const result = checkIDA(ast);
if (result) {
  console.log("ReDoSを引き起こす可能性のある正規表現");
} else {
  //EDA構造の確認
  // Disjunction処理
  traverse(ast, {
    Disjunction(path) {
      if (foundDisjunction == false && foundRepetition == false) {
        // Disjunctionが先に見つかった場合
        foundDisjunction = true;
        disjunctionNode = path.node;

        Disjunction(disjunctionNode);
      }
    },

    // Repetition処理
    Repetition(path) {
      if (foundRepetition == false && foundDisjunction == false) {
        // Repetitionが先に見つかった場合
        foundRepetition = true;
        RepetitionNode = path.node;

        Repetition(RepetitionNode);
      }
    },
  });

  console.log(JSON.stringify(ast, null, 2)); //AST全体確認
  // console.log(JSON.stringify(disjunctionNode, null, 2)); //分岐ノードのみ確認
  // console.log(JSON.stringify(RepetitionNode, null, 2)); //Repetitionノードのみ確認（RepetitionNode2でネスト内側のRepetitionノード確認）

  // console.log(AutomatonArray);

  //NetworkXに合う形にオートマトンを変換する部分
  let ArrangedArray = AutomatonArray.map(
    (item) => `(${item[0]}, ${item[1]})`
  ).join(", ");
  let FinalArray = "[" + ArrangedArray + "]";

  console.log(FinalArray);

  //Pythonに送信する部分
  fetch("http://localhost:5000/receive_data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(FinalArray),
  })
    .then((response) => response.json())
    .then((data) => {
      //返ったデータから強連結成分分解を確認
      for (let i = 0; i < data.length; i++) {
        if (data[i].length >= 2) {
          console.log("ReDoSを引き起こす可能性のある正規表現");
          return;
        }
      }
      console.log("ReDoSを引き起こす可能性のない正規表現");
    })
    .catch((error) => {
      console.error("Error:", error);
    });

  const endTime = Date.now();
  console.log(`${endTime - startTime} ms`);
}

function Disjunction(Node) {
  if (
    //左右に"*"がかかっている場合
    Node.left.type === "Repetition" &&
    Node.right.type === "Repetition"
  ) {
    if (
      //左右が同値の場合
      Node.left.expression.value === Node.right.expression.value
    ) {
      AutomatonArray.push(
        [0, Number(Node.left.expression.value)],
        [0, Number(Node.right.expression.value) + 100],
        [
          Number(Node.left.expression.value),
          Number(Node.left.expression.value),
        ],
        [
          Number(Node.right.expression.value) + 100,
          Number(Node.right.expression.value) + 100,
        ],
        [
          Number(Node.left.expression.value),
          Number(Node.right.expression.value) + 100,
        ],
        [
          Number(Node.right.expression.value) + 100,
          Number(Node.left.expression.value),
        ]
      );
    } else {
      //左右が同値でない場合
      AutomatonArray.push(
        [0, Number(Node.left.expression.value)],
        [0, Number(Node.right.expression.value)],
        [
          Number(Node.left.expression.value),
          Number(Node.left.expression.value),
        ],
        [
          Number(Node.right.expression.value),
          Number(Node.right.expression.value),
        ]
      );
      // console.log("right");
    }
  } else if (Node.left.type === "Repetition") {
    //左に"*"がかかっている場合
    if (
      //左右が同値の場合
      Node.left.expression.value === Node.right.value
    ) {
      AutomatonArray.push(
        [0, Number(Node.left.expression.value)],
        [0, Number(Node.right.value) + 100],
        [Number(Node.left.expression.value), Number(Node.left.expression.value)]
      );
      // console.log("right");
    } else {
      //左右が同値でない場合
      AutomatonArray.push(
        [0, Number(Node.left.expression.value)],
        [0, Number(Node.right.value)],
        [Number(Node.left.expression.value), Number(Node.left.expression.value)]
      );
    }
  } else if (Node.right.type === "Repetition") {
    //右に"*"がかかっている場合
    if (
      //左右が同値の場合
      Node.left.value === Node.right.expression.value
    ) {
      AutomatonArray.push(
        [0, Number(Node.left.value)],
        [0, Number(Node.right.expression.value) + 100],
        [
          Number(Node.right.expression.value) + 100,
          Number(Node.right.expression.value) + 100,
        ]
      );
    } else {
      //左右が同値でない場合
      AutomatonArray.push(
        [0, Number(Node.left.value)],
        [0, Number(Node.right.expression.value)],
        [
          Number(Node.right.expression.value),
          Number(Node.right.expression.value),
        ]
      );
    }
  } else {
    //ノーマルの場合
    if (Node.left.value === Node.right.value) {
      //左右が同値の場合
      AutomatonArray.push(
        [0, Number(Node.left.value)],
        [0, Number(Node.right.value) + 100]
      );
    } else {
      //左右が同値でない場合
      AutomatonArray.push(
        [0, Number(Node.left.value)],
        [0, Number(Node.right.value)]
      );
    }
  }
}

function Repetition(Node) {
  if (
    //これ以降のDisjunctionの確認方法はGroupになってる
    Node.expression.type === "Group" &&
    Node.expression.expression.type === "Repetition"
  ) {
    Node2 = Node.expression.expression;
  }

  if (Node2) {
    //"*"がネストしている場合
    AutomatonArray.push(
      [0, Number(Node2.expression.value)],
      [0, Number(Node2.expression.value) + 100],
      [Number(Node2.expression.value), Number(Node2.expression.value)],
      [
        Number(Node2.expression.value) + 100,
        Number(Node2.expression.value) + 100,
      ],
      [Number(Node2.expression.value), Number(Node2.expression.value) + 100],
      [Number(Node2.expression.value) + 100, Number(Node2.expression.value)]
    );
  } else if (
    //"*"が"|"にかかっているかつ中身の左右が同値の場合
    Node.expression.type === "Group" &&
    Node.expression.expression.left.value ===
      Node.expression.expression.right.value
  ) {
    AutomatonArray.push(
      [0, Number(Node.expression.expression.left.value)],
      [0, Number(Node.expression.expression.right.value) + 100],
      [
        Number(Node.expression.expression.left.value),
        Number(Node.expression.expression.left.value),
      ],
      [
        Number(Node.expression.expression.right.value) + 100,
        Number(Node.expression.expression.right.value) + 100,
      ],
      [
        Number(Node.expression.expression.left.value),
        Number(Node.expression.expression.right.value) + 100,
      ],
      [
        Number(Node.expression.expression.right.value) + 100,
        Number(Node.expression.expression.left.value),
      ]
    );
  } else if (Node.expression.type === "Group") {
    //"*"が"|"にかかっている場合
    AutomatonArray.push(
      [0, Number(Node.expression.expression.left.value)],
      [0, Number(Node.expression.expression.right.value)],
      [
        Number(Node.expression.expression.left.value),
        Number(Node.expression.expression.left.value),
      ],
      [
        Number(Node.expression.expression.right.value),
        Number(Node.expression.expression.right.value),
      ]
    );
  } else {
    //"*"単体の場合
    AutomatonArray.push(
      [0, Number(Node.expression.value)],
      [Number(Node.expression.value), Number(Node.expression.value)]
    );
  }
}
