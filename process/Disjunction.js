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
module.exports.Disjunction = Disjunction;
