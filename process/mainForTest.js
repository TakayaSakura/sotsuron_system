const { parse, traverse } = require("regexp-tree");

function analyzeRegex(inputRegex, sendToPython) {
  const startTime = Date.now();

  function removeLastDigit(regexStr) {
    const lastChar = regexStr[regexStr.length - 1];
    return /\d/.test(lastChar) ? regexStr.slice(0, -1) : regexStr;
  }

  const modifiedRegexStr = removeLastDigit(inputRegex);
  const ast = parse(modifiedRegexStr);

  let AutomatonArray = [];
  let foundDisjunction = false;
  let foundRepetition = false;

  function checkIDAEDA(ast) {
    let found = false;

    traverse(ast, {
      Alternative(path) {
        const expressions = path.node.expressions;
        if (expressions.length === 2) {
          const firstRepetition = expressions[0];
          const secondRepetition = expressions[1];
          if (
            firstRepetition.type === "Repetition" &&
            secondRepetition.type === "Repetition" &&
            firstRepetition.expression.value ===
              secondRepetition.expression.value
          ) {
            found = true;
          }
        }
      },
    });

    return found;
  }

  function Disjunction(Node) {
    if (Node.left.type === "Repetition" && Node.right.type === "Repetition") {
      if (Node.left.expression.value === Node.right.expression.value) {
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
      }
    } else if (Node.left.type === "Repetition") {
      if (Node.left.expression.value === Node.right.value) {
        AutomatonArray.push(
          [0, Number(Node.left.expression.value)],
          [0, Number(Node.right.value) + 100],
          [
            Number(Node.left.expression.value),
            Number(Node.left.expression.value),
          ]
        );
      } else {
        AutomatonArray.push(
          [0, Number(Node.left.expression.value)],
          [0, Number(Node.right.value)],
          [
            Number(Node.left.expression.value),
            Number(Node.left.expression.value),
          ]
        );
      }
    } else if (Node.right.type === "Repetition") {
      if (Node.left.value === Node.right.expression.value) {
        AutomatonArray.push(
          [0, Number(Node.left.value)],
          [0, Number(Node.right.expression.value) + 100],
          [
            Number(Node.right.expression.value) + 100,
            Number(Node.right.expression.value) + 100,
          ]
        );
      } else {
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
      if (Node.left.value === Node.right.value) {
        AutomatonArray.push(
          [0, Number(Node.left.value)],
          [0, Number(Node.right.value) + 100]
        );
      } else {
        AutomatonArray.push(
          [0, Number(Node.left.value)],
          [0, Number(Node.right.value)]
        );
      }
    }
  }

  function Repetition(Node) {
    if (
      Node.expression.type === "Group" &&
      Node.expression.expression.type === "Repetition"
    ) {
      Node2 = Node.expression.expression;
    }

    if (Node2) {
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
      AutomatonArray.push(
        [0, Number(Node.expression.value)],
        [Number(Node.expression.value), Number(Node.expression.value)]
      );
    }
  }

  const result = checkIDAEDA(ast);

  if (result) {
    return "ReDoSを引き起こす可能性のある正規表現";
  }

  traverse(ast, {
    Disjunction(path) {
      if (!foundDisjunction && !foundRepetition) {
        foundDisjunction = true;
        disjunctionNode = path.node;
        Disjunction(disjunctionNode);
      }
    },
    Repetition(path) {
      if (!foundRepetition && !foundDisjunction) {
        foundRepetition = true;
        RepetitionNode = path.node;
        Repetition(RepetitionNode);
      }
    },
  });

  const FinalArray = AutomatonArray.map(
    (item) => `(${item[0]}, ${item[1]})`
  ).join(", ");

  if (sendToPython) {
    sendToPython(FinalArray);
  }

  const endTime = Date.now();
  console.log(`${endTime - startTime} ms`);

  return FinalArray;
}

module.exports = { analyzeRegex };
