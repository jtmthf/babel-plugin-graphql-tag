import * as t from 'babel-types';
import { parse } from 'babylon';
import gql from 'graphql-tag';

export default function () {
  function compile(node: t.TemplateLiteral) {
    let source = '';
    node.quasis.forEach(quasi => {
      source += quasi.value.raw;
    });

    const doc = parse(`var doc = ${JSON.stringify(gql`${source}`)}`);
    const expressions = node.expressions.map(expression => {
      if (t.isIdentifier(expression)) {
        return expression;
      }
    }).filter(name => name) as t.Identifier[];

    const forEachFragment = t.expressionStatement(
      t.callExpression(t.memberExpression(t.arrayExpression(expressions), t.identifier('forEach')),
        [t.functionExpression(undefined, [t.identifier('expression') as any], t.blockStatement([
          t.expressionStatement(t.callExpression(t.memberExpression(
            t.memberExpression(t.identifier('doc'), t.identifier('definitions')),
            t.identifier('concat')
          ), [t.memberExpression(t.identifier('expression'), t.identifier('definitions'))])),
        ]))]
      ));

    const returnStatement = t.returnStatement(t.identifier('doc'));

    return t.callExpression(t.functionExpression(undefined, [], t.blockStatement([
      (doc as t.File).program.body[0] as t.VariableDeclaration,
      forEachFragment,
      returnStatement,
    ])), []);
  }

  interface TaggedTemplateExpressionPath {
    node: t.TaggedTemplateExpression;
    replaceWith(quasi: t.CallExpression): void;
  }

  return {
    visitor: {
      TaggedTemplateExpression(path: TaggedTemplateExpressionPath) {
        if (t.isIdentifier(path.node.tag, { name: 'gql' })) {
          path.replaceWith(
            compile(path.node.quasi)
          );
        }
      },
    },
  };
}
