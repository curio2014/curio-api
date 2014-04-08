# Responder

一个Responder里存储多条 rules ，一条 rule 的规则定义必须是一下形式：

```
{
  pattern: [
    'keyword1',
    'keyword2',
    '^keyword3$'
  ],
  handler: [
  ]
}
```
