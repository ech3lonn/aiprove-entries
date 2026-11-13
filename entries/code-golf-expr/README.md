# code-golf-expr

`golf.js` — 21 bytes, exports `evalExpr`:

```js
exports.evalExpr=eval
```

Passes all 9 public cases (`1+2*3`→7, `(1+2)*3`→9, `10/4`→2.5,
`2*2*2*2`→16, `7-3-2`→2, `(8-2)/(1+2)`→2, `3.5+1.5`→5, `100`→100,
`2*(3+(4-1))`→12) plus unary minus, decimals and whitespace.
