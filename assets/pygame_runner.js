let PyGameRunner = {
    thisScriptSrc: document.currentScript.src,
    pyodide: null,
    currentRunGlobals: null,
    currentRunPromise: null,
    waitForPyodide: async function() {
        if (PyGameRunner.pyodide !== null) {
            return PyGameRunner.pyodide;
        } else {
            PyGameRunner.pyodide = await loadPyodide({
                packages: [
                    'pygame-ce',
                    'numpy',
                    new URL('pyodide/pgzero-1.2.1-py3-none-any.whl', PyGameRunner.thisScriptSrc).toString()
                ]
            });
            return PyGameRunner.pyodide;
        }
    },
    preloadImage: async function (imageURL) {
        let pyodide = await PyGameRunner.waitForPyodide();
        pyodide.FS.mkdirTree("/home/pyodide/images");
        const filePath = "/home/pyodide/images/" + imageURL.substring(imageURL.lastIndexOf('/')+1);
        if (!pyodide.FS.analyzePath(filePath).exists) {
            const imageData = await fetch(imageURL).then(image => image.arrayBuffer());
            pyodide.FS.writeFile(filePath, new Uint8Array(imageData));
        }
    },
    run: async function(canvas, code) {
        let pyodide = await PyGameRunner.waitForPyodide();
        pyodide.canvas.setCanvas2D(canvas);

        const exitingVariableName = "EXITING";
        if (PyGameRunner.currentRunGlobals !== null) {
            PyGameRunner.currentRunGlobals.set(exitingVariableName, true);
            await PyGameRunner.currentRunPromise;
            console.log("Restart!");
        }
        let exitingVariableObject = {};
        exitingVariableObject[exitingVariableName] = false;
        PyGameRunner.currentRunGlobals = pyodide.toPy(exitingVariableObject);
        pyodide.setDebug(true);

        const CODE_PRELUDE =
            `import sys
import pgzero.loaders
import pgzero.game
from pgzero.builtins import *
pgzero.loaders.set_root(__file__)
import pygame
pygame.display.set_mode((800, 600))`;
        const CODE_SUFFIX =
            `async def RUN__():
  await pgzero.game.PGZeroGame(sys.modules[__name__]).run()`;

        pyodide.FS.writeFile("main.py", CODE_PRELUDE + "\n" + code + "\n" + CODE_SUFFIX, { encoding: "utf8" });
        PyGameRunner.currentRunPromise = pyodide.runPythonAsync(`
import time
import asyncio
import pygame
import pgzero
import pgzero.game
import pgzero.runner
import pgzero.screen

class Timer:
    """Context manager to time the game loop."""
    __slots__ = (
        'name',
        'total', 'count', 'worst',
        'start',
        'print',
    )
    def __init__(self, name, print=False):
        self.name = name
        self.total = 0
        self.count = 0
        self.worst = 0
        self.print = print
    def __enter__(self):
        self.start = time.perf_counter()
    def __exit__(self, *_):
        t = (time.perf_counter() - self.start) * 1e3
        self.count += 1
        self.total += t
        if t > self.worst:
            self.worst = t
    def get_mean(self) -> float:
        mean = self.total / self.count
        if self.print:
            print(
                f"{self.name} mean: {mean:0.1f}ms  "
                f"worst: {self.worst:0.1f}ms")
        self.worst = self.total = self.count = 0
        return mean

def OVERRIDE_sleep(duration):
  raise RuntimeError("time.sleep() is disabled")
time.sleep = OVERRIDE_sleep

async def OVERRIDE_run_mod(mod, **kwargs):
    """Run the module."""
    print("run_mod()", mod, **kwargs)
    await pgzero.runner.PGZeroGame(mod, **kwargs).run()
pgzero.runner.run_mod = OVERRIDE_run_mod

def OVERRIDE_show_default_icon():
  pass
def OVERRIDE_reinit_screen(self) -> bool:
    """Reinitialise the window.

    Return True if the dimensions of the screen changed.

    """
    changed = False
    mod = self.mod
    
    icon = getattr(self.mod, 'ICON', pgzero.game.DEFAULTICON)
    if icon and icon != self.icon:
#        self.show_icon()
        pass
    w = getattr(mod, 'WIDTH', 800)
    h = getattr(mod, 'HEIGHT', 600)
    if w != self.width or h != self.height:
        self.screen = pygame.display.set_mode((w, h), pgzero.game.DISPLAY_FLAGS)
        if hasattr(self.mod, 'screen'):
            self.mod.screen.surface = self.screen
        else:
            self.mod.screen = pgzero.screen.Screen(self.screen)
        
        # Set the global screen that actors blit to
        pgzero.game.screen = self.screen
        self.width = w
        self.height = h
        
        # Dimensions changed, request a redraw
        changed = True
    
    title = getattr(self.mod, 'TITLE', 'Pygame Zero Game')
    if title != self.title:
#        pygame.display.set_caption(title)
        self.title = title
    return changed
async def OVERRIDE_frames(fps=60):
    """Iterate over frames at the given fps, yielding time delta (in s)."""
    tgt = 1 / fps  # target frame time

    t = time.perf_counter()
    dt = tgt

    while True:
        yield dt
        nextt = time.perf_counter()
        dt = nextt - t
        if dt < tgt:
            await asyncio.sleep(tgt - dt)
            nextt = time.perf_counter()
            dt = nextt - t
        t = nextt
async def async_enumerate(asequence, start=0):
    """Asynchronously enumerate an async iterator from a given start value"""
    n = start
    async for elem in asequence:
        yield n, elem
        n += 1
async def OVERRIDE_mainloop(self):
    """Run the main loop of Pygame Zero."""
    clock = pygame.time.Clock()
    self.reinit_screen()

    update = self.get_update_func()
    draw = self.get_draw_func()
    self.load_handlers()

    pgzclock = pgzero.clock.clock

    self.need_redraw = True
    while not ${exitingVariableName}:
        await asyncio.sleep(1/60)
        dt = (1/60) * 1000
        
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_q and event.mod & (pygame.KMOD_CTRL | pygame.KMOD_META):
                    sys.exit(0)
                self.keyboard._press(event.key)
            elif event.type == pygame.KEYUP:
                self.keyboard._release(event.key)
            self.dispatch_event(event)
        
        pgzclock.tick(dt)
        
        if update:
            update(dt)
        
        screen_change = self.reinit_screen()
        if screen_change or update or pgzclock.fired or self.need_redraw:
            draw()
            pygame.display.flip()
            self.need_redraw = False
    print("Exiting...")
async def OVERRIDE_run(self):
    """Invoke the main loop, and then clean up."""
    try:
        await self.mainloop()
    finally:
        pygame.display.quit()
        pygame.mixer.quit()
pgzero.game.PGZeroGame.show_default_icon = staticmethod(OVERRIDE_show_default_icon)
pgzero.game.PGZeroGame.reinit_screen = OVERRIDE_reinit_screen
pgzero.game.PGZeroGame.frames = OVERRIDE_frames
pgzero.game.PGZeroGame.mainloop = OVERRIDE_mainloop
pgzero.game.PGZeroGame.run = OVERRIDE_run

import sys
import importlib
main = importlib.import_module("main")
for module_name in list(sys.modules.keys()):
    if module_name == "pgzero.clock" and module_name in sys.modules:
        module = sys.modules[module_name]
        importlib.reload(module)
        del module

main = importlib.reload(main)
await main.RUN__()
print("Exited.")`, {globals: PyGameRunner.currentRunGlobals, locals: PyGameRunner.currentRunGlobals, filename: "/home/pyodide/main.py"});
        await PyGameRunner.currentRunPromise.catch(_ => {});
    }
};