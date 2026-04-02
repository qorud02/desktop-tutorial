from textual.app import App, ComposeResult
from textual.widgets import Header, Footer, TextArea, Label
from textual.binding import Binding
from textual.containers import Vertical
from pathlib import Path
import sys


class TextEditor(App):
    """A simple text editor built with Textual."""

    CSS = """
    #status {
        height: 1;
        background: $panel;
        color: $text-muted;
        padding: 0 1;
        dock: bottom;
    }
    TextArea {
        border: none;
    }
    """

    BINDINGS = [
        Binding("ctrl+s", "save", "Save"),
        Binding("ctrl+n", "new", "New"),
        Binding("ctrl+o", "open_file", "Open"),
        Binding("ctrl+q", "quit", "Quit"),
    ]

    def __init__(self, filepath: str | None = None):
        super().__init__()
        self.filepath: Path | None = Path(filepath) if filepath else None
        self._modified = False

    def compose(self) -> ComposeResult:
        yield Header()
        yield TextArea(id="editor", language="markdown")
        yield Label("Ctrl+S: Save  Ctrl+N: New  Ctrl+Q: Quit", id="status")
        yield Footer()

    def on_mount(self) -> None:
        self._update_title()
        editor = self.query_one("#editor", TextArea)
        if self.filepath and self.filepath.exists():
            editor.load_text(self.filepath.read_text(encoding="utf-8"))
            self._modified = False
        editor.focus()

    def on_text_area_changed(self) -> None:
        if not self._modified:
            self._modified = True
            self._update_title()

    def _update_title(self) -> None:
        name = self.filepath.name if self.filepath else "Untitled"
        modified = " *" if self._modified else ""
        self.title = f"Text Editor - {name}{modified}"

    def action_save(self) -> None:
        if self.filepath is None:
            self.notify("No file path set. Use 'Ctrl+S' after specifying a file.", severity="warning")
            return
        editor = self.query_one("#editor", TextArea)
        self.filepath.write_text(editor.text, encoding="utf-8")
        self._modified = False
        self._update_title()
        self.notify(f"Saved: {self.filepath}")

    def action_new(self) -> None:
        self.filepath = None
        self._modified = False
        editor = self.query_one("#editor", TextArea)
        editor.load_text("")
        self._update_title()
        self.notify("New file")

    def action_open_file(self) -> None:
        self.notify("Pass a filename as argument: python editor.py <file>", severity="information")


if __name__ == "__main__":
    filepath = sys.argv[1] if len(sys.argv) > 1 else None
    app = TextEditor(filepath)
    app.run()
