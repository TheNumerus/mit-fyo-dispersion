import {Application} from "./app.js"

let app = new Application()

window.onresize = (e) => app.resize()

app.run()
