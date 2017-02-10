import { transform, TransformOptions } from 'babel-core';
import Plugin from '../src';

const options: TransformOptions = {
  plugins: [Plugin],
  presets: ['es2015'],
};

test('parses queries', () => {
  const {code} = transform('gql`{ testQuery }`', options);
  expect(eval(code).kind).toEqual('Document');
});
