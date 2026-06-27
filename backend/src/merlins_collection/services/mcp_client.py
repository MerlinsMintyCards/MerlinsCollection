"""MCP server client (placeholder — not yet implemented).

Will spawn the ``mcp-server`` process and expose its tools as a callable that
``dependencies.get_bedrock_service`` can pass to ``BedrockChatService``. Until
then chat runs with a stub executor that returns a "not configured" message.
To be built test-first (see CLAUDE.md TDD guidelines).
"""
