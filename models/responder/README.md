# Responder

一个Responder里存储多条 rules ，一条 rule 的规则定义必须是一下形式：

```
{
  pattern: [
    {
      text: 'keyword1',
      blur: true,
    }, {
      text: 'keyword2',
      blur: false,
    }
  ],
  handler: [
  ]
}
```
