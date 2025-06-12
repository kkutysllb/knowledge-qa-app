# 文件上传问题修复调试指南

## 问题分析

根据错误信息 `POST http://111.19.156.74:8030/api/workflows/knowledge-qa/upload 400 (Bad Request)`，问题出现在移动端向服务器发送文件上传请求时。

## 修复内容

### 1. API参数格式修复

- **布尔值格式**：确保 `use_kb` 和 `stream` 参数发送正确的字符串格式（"true"/"false"）
- **必要参数**：添加了缺失的 `temperature` 和 `max_tokens` 参数
- **文件对象**：优化了文件对象的格式，确保兼容性

### 2. 错误处理优化

- 增加了详细的错误信息输出
- 添加了调试日志来追踪请求参数
- 移除了可能导致问题的手动 Content-Type 设置

### 3. 调试功能

- 在开发环境下输出详细的 FormData 内容
- 记录文件信息（名称、大小、类型）
- 提供完整的错误响应信息

## 测试步骤

### 1. 验证修复

1. 启动应用
2. 在问答页面尝试上传文件（PDF、Word、图片等）
3. 检查控制台输出的调试信息
4. 观察是否还有 400 错误

### 2. 调试信息检查

查看控制台是否输出类似信息：

```
发送文件上传请求: {
  url: "http://111.19.156.74:8030/api/workflows/knowledge-qa/upload",
  query: "请分析这个文档...",
  fileName: "test.pdf",
  fileSize: 12345,
  fileType: "application/pdf",
  useKb: true,
  model: "default",
  kbName: "default",
  stream: true
}

FormData内容:
query: 请分析这个文档
use_kb: true
stream: true
model: default
kb_name: default
temperature: 0.7
max_tokens: 8192
file: { name: "test.pdf", type: "application/pdf", uri: "file://..." }
```

### 3. 常见问题排查

- 确保服务器正常运行
- 检查网络连接
- 验证认证令牌有效
- 确认文件格式支持

## 对比Web端实现

Web端API期望的参数格式：

```python
@router.post("/knowledge-qa/upload")
async def run_knowledge_qa_with_file(
    query: str = Form(...),
    file: UploadFile = File(None),
    use_kb: bool = Form(False),
    model: str = Form("default"),
    kb_name: Optional[str] = Form(None),
    stream: bool = Form(False),
    temperature: float = Form(0.7),
    max_tokens: int = Form(8192)
):
```

移动端现在发送的格式已与此对齐。

## 如果问题仍然存在

1. 检查服务器日志，查看具体的400错误原因
2. 验证文件是否过大或格式不支持
3. 测试不同类型的文件
4. 确认API端点是否正确

## React Native文本节点错误修复

已检查并确认设置页面的代码结构正确，没有发现明显的文本节点问题。如果仍有此错误，请检查：

- View组件内是否有直接的文本内容（应该用Text组件包装）
- 条件渲染是否返回了非期望的内容类型
