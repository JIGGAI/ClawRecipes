# Template Variables

ClawRecipes supports powerful template variable substitution for workflow prompts, file paths, and content. Variables use double-brace syntax: `{{variable.name}}`.

## Global Variables

These variables are available in all nodes:

- `{{date}}` — Current ISO timestamp (e.g., `2025-04-04T03:53:00.000Z`)
- `{{run.id}}` — Unique run ID (timestamp-based, e.g., `2025-04-04T03-53-00-123Z`)
- `{{run.timestamp}}` — Alias for `{{run.id}}`
- `{{workflow.id}}` — Workflow ID from the JSON file
- `{{workflow.name}}` — Workflow display name (fallback to ID or filename)
- `{{node.id}}` — Current node ID (available in media nodes)

## Upstream Node Variables

Access outputs from previous workflow nodes using the pattern `{{nodeId.fieldName}}`:

### Basic Access Patterns

- `{{nodeId.output}}` — Full JSON output envelope from the node
- `{{nodeId.text}}` — The `text` field from the node output (most common)
- `{{nodeId.fieldName}}` — Any specific field from the node output JSON

### Common Pitfall: output vs text

**Wrong:** `{{brand_review.output}}` returns the full envelope:
```json
{
  "runId": "2025-04-04T03-53-00-123Z",
  "teamId": "marketing-team",
  "nodeId": "brand_review",
  "kind": "llm",
  "text": "Here is my review...",
  "completedAt": "2025-04-04T03:53:15.000Z"
}
```

**Right:** `{{brand_review.text}}` returns just the payload:
```
Here is my review...
```

## Nested JSON Extraction

When a node's `text` field contains JSON, ClawRecipes automatically extracts nested fields:

### Example Node Output
```json
{
  "text": "{\"title\": \"Product Launch\", \"tags\": [\"marketing\"], \"approved\": true}"
}
```

### Available Template Variables
- `{{nodeId.text}}` — Raw JSON string
- `{{nodeId.title}}` — Extracted: "Product Launch"  
- `{{nodeId.approved_json}}` — For non-string values: "true"

### Deeply Nested Extraction
If the JSON contains nested objects, fields are flattened:

```json
{
  "text": "{\"meta\": {\"author\": \"John\", \"priority\": 1}}"
}
```

Available as:
- `{{nodeId.meta_json}}` — Full meta object as JSON string
- `{{nodeId.author}}` — "John" (if meta.author is a string)

## LLM Node Structured Output

LLM nodes with `outputFields` configuration produce predictable JSON structures:

### Configuration
```json
{
  "config": {
    "outputFields": [
      {"name": "title", "type": "text"},
      {"name": "tags", "type": "list"}, 
      {"name": "metadata", "type": "json"}
    ]
  }
}
```

### Template Access
```
Title: {{nodeId.title}}
Tags: {{nodeId.tags}}  
Metadata: {{nodeId.metadata_json}}
```

## Usage Examples

### LLM Prompt Template
```
Review the content from the previous step:

{{brand_review.text}}

Based on this review, create a social media post with:
- Title: engaging and on-brand
- Content: max 280 characters
- Hashtags: 3-5 relevant tags

Current date: {{date}}
Workflow: {{workflow.name}}
```

### File Path Templates
```json
{
  "tool": "fs.write",
  "args": {
    "path": "content/{{run.id}}/{{brand_review.title}}.md",
    "content": "# {{brand_review.title}}\n\n{{brand_review.text}}"
  }
}
```

### Media Node Prompts
```json
{
  "config": {
    "promptTemplate": "Create an image for: {{content_draft.title}}\n\nStyle: {{brand_review.style}}\nMood: professional and engaging"
  }
}
```

## Implementation Details

Template substitution happens in the workflow worker during node execution. The code path is:

- **Primary**: `src/lib/workflows/workflow-worker.ts` — `buildTemplateVars()` function
- **Utility**: `src/lib/workflows/workflow-utils.ts` — `templateReplace()` function

### Variable Resolution Process

1. **Global vars** are built from run metadata and timestamps
2. **Node outputs** are loaded from each completed node's output file
3. **JSON parsing** attempts to extract fields from the `text` field
4. **Nested extraction** flattens nested objects with `_json` suffixes for non-strings
5. **Template replacement** applies all variables using simple string substitution

### Performance Notes

- Variables are rebuilt for each node execution (fresh state)
- Large node outputs are fully loaded into memory during template resolution
- JSON parsing failures are silently ignored (graceful degradation)

## Best Practices

### Variable Naming
- Use descriptive node IDs: `brand_review` not `step1`
- Design consistent output field names across nodes
- Use `outputFields` for structured LLM outputs

### Error Handling
- Always provide fallbacks: `{{nodeId.title || "Untitled"}}`  
- Test templates with missing/malformed node outputs
- Use `{{nodeId.text}}` when unsure about field structure

### Memory Management
- Avoid extremely large text outputs in frequently-referenced nodes
- Consider splitting large data into separate file outputs

## Common Patterns

### Content Pipeline
```
1. research_node.text → "Market analysis shows..."
2. draft_node template: "Based on {{research_node.text}}, write..."
3. review_node template: "Review this draft: {{draft_node.text}}"
```

### Conditional Content
```
{% if brand_review.approved %}
Approved content: {{brand_review.text}}
{% else %}
Needs revision: {{brand_review.feedback}}
{% endif %}
```

Note: ClawRecipes uses simple string substitution, not template engines like Jinja2. Complex conditionals should be handled in LLM prompts.

## Related Documentation

- [WORKFLOW_NODES.md](WORKFLOW_NODES.md) — Node types and configuration
- [WORKFLOW_EXAMPLES.md](WORKFLOW_EXAMPLES.md) — Template usage examples
- [MEDIA_GENERATION.md](MEDIA_GENERATION.md) — Media node templates and variables