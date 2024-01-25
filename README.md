# Docs Template

## Running Docs Site Locally

This repository uses submodules.
To ensure you have everything you need, clone recursively:
```shell
git clone --recursive https://github.com/CoderDojoBrighton/your-project.git
```

We use the static site generator [Hugo](https://gohugo.io/).
You can find the installation instructions [here](https://gohugo.io/installation/).

To run the docs:
```shell
hugo serve
# Or
make docs
```
This should live-reload as you edit content.


## Editing Tips

The docs site uses the following layout:

```
your-project
├─ hugo.toml - Site settings
├─ content/
|  ├─ _index.md - Main page content
|  ├─ docs/
|  |  ├─ section-1/
|  |  |  ├─ _index.md - Secion 1 contents. Defines sidebar settings
|  |  |  ├─ topic-1
|  |  |  |  ├─ _index.md - Content for topic-1
```

Hugo uses [Markdown](https://www.markdownguide.org/basic-syntax/).

Additionally, [shortcodes](https://gohugo.io/content-management/shortcodes/) can be used - essentially templates for content.
For example, highlightable code blocks, YouTube video player and Gists.
The theme we use provides [additional shortcodes](https://hugo-book-demo.netlify.app/) for things like mermaid diagrams, hints and expandable sections.

Photos should be added to `static/project-name/...`.
They can then be added to a page like this:
```markdown
![Description here](/your-project/project-name/...)
```

