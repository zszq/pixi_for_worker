To make PIXI work in web worker you need two things:
- pass events from main thread to web worker (you can see this in index.html)
- pass these events to pixi event listeners (you can see this in worker.js)

Passing events to pixi requires some trickery, i.e. capturing calls to addEventListener, so you can store them and use for your proxied events. 
You can see all required hacks in worker.js.