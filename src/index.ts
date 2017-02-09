import * as t from 'babel-types';
import gql from 'graphql-tag';

export default function () {
  function astify(obj: any) {
    if (obj === null) {
      return t.nullLiteral();
    }
    switch (typeof obj) {
      case 'number':
        return t.numericLiteral(obj);
      case 'string':
        return t.stringLiteral(obj);
      case 'boolean':
        return t.booleanLiteral(obj);
      case 'undefined':
        return t.unaryExpression('void', t.numericLiteral(0), true);
        default:
          if (Array.isArray(obj)) {
            return t.arrayExpression(obj.map(astify));
          }
          return t.objectExpression(Object.keys(obj)
            .filter(k => {
              return typeof obj[k] !== 'undefined';
            })
            .map(k => {
              return t.objectProperty(
                t.stringLiteral(k),
                astify(obj[k])
              );
            }));
    }
  }

  function compile(node: t.TemplateLiteral) {
    let source = '';
    node.quasis.forEach(quasi => {
      source += quasi.value.raw;
    });

    const doc = gql`${source}`;
    const expressions = node.expressions.map(expression => {
      if (t.isIdentifier(expression)) {
        return expression.name;
      }
    });

    return t.callExpression(t.functionExpression(null, null, t.blockStatement([
      t.variableDeclaration('var', [
        t.variableDeclarator(t.identifier('doc'), astify(doc))
      ]),
      t.expressionStatement(t.callExpression(t.memberExpression(t.identifier('expressions'), t.identifier('forEach')),
        [t.functionExpression(null, [t.assignmentPattern(t.identifier('expression'))], t.blockStatement([
          t.expressionStatement(t.callExpression(t.memberExpression(
            t.memberExpression(t.identifier('doc'), t.identifier('definitions')),
            t.identifier('concat')
          ), [t.memberExpression(t.identifier('expression'), t.identifier('definitions'))]))
        ]))]
      )),
      t.returnStatement(t.identifier('doc')),
    ])), null);
  }

  return {
    visitor: {
      TaggedTemplateExpression(path) {
        if (t.isIdentifier(path.node.tag, { name: 'gql' })) {
          path.node = compile(path.node.quasi);
        }
      }
    }
  }
}
