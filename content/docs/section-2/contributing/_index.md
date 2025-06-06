---
weight: 1
bookFlatSection: false
title: "Contributing"
---

## Architecture
### Site Generator
This site uses the Hugo static site generator and is based on our
[Tutorial Template](https://github.com/CoderDojoBrighton/tutorial-template). Refer to the documentation there for
information on creating new pages, content and some useful shortcodes.

### Blockly
The Scratch-like examples used on this site are constructed using the [Blockly](https://developers.google.com/blockly)
library. This is the same library that underpins Scratch's block renderer, so it should behave similarly.

## Blockly Content
### Embedding
To include a sample in a page, use the `{{</* blockly */>}}` shortcode, e.g.
```tpl
{{</* blockly readonly=true sample=blocks.json */>}}
```

The blockly shortcode has two attributes:
 - `readonly`: Determines if the editor is enabled (only enabled if `readonly` is absent)
 - `sample`: The sample block code to pre-populate the environment with. Essential when `readonly=true`.

### Creating new samples
At this point in time, samples are best created in the editor. This is because direct translation from a language to
Blockly blocks is not possible, though you can translate from Blockly blocks into a programming language.

To create a new sample, start by embedding an empty editor:
```tpl
{{</* blockly */>}}
```

Once you've placed your blocks, right-click on a blank area of the workspace canvas and click on the `Copy workspace`
menu item. This will copy the workspace JSON to your clipboard. It should look a bit like the following:

```json
{
  "sprites": [
    {
      "name": "__builtin__",
      "image": "__builtin__.png",
      "workspace": { /* Workspace blocks go here. */ }
    }
  ]
}
```

Paste the JSON into a new file (for example `basketball_blocks.json`), replacing instances of `__builtin__` with your
sprite's name.

Then edit the blockly embed shortcode to reference the newly-created sample:
```tpl
{{</* blockly readonly=true sample=basketball_blocks.json */>}}
```

### Using multiple sprites
To add additional sprites, edit the sample JSON to add additional entries to the top-level `sprites` array.

```json
{
  "sprites": [
    {
      "name": "sprite_a",
      "image": "sprite_a.png",
      "workspace": { /* Sprite A Blockly workspace goes here. */ }
    },
    {
	  "name": "sprite_b",
	  "image": "sprite_b.png",
	  "workspace": { /* Sprite B Blockly workspace goes here. */ }
    }
  ]
}
```

For reference, a blank sprite JSON would be the following:
```json
{
  "name": "sprite",
  "image": "sprite.png",
  "workspace": {
	  "blocks": {
        "languageVersion": 0,
        "blocks": []
      }
  }
}
```

### Creating new blocks
See the [Blockly documentation](https://developers.google.com/blockly/guides/create-custom-blocks/overview) for more information.

Remember to add newly created blocks to the toolbox to make them visible in the editor.

The file to edit for this is [blockly_example.js](https://github.com/CoderDojoBrighton/moving-on-from-scratch/blob/main/assets/blockly_example.js).