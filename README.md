# victorious pirate

dashboard sandbox builded with:

Frontend: react.js + material-ui + redux + firebase 2 client

Server: java + akka + apache poi

Database: firebase 2 + filepicker

## Demo

Demo can be found here: https://victorious-pirate.herokuapp.com/

Login: admin@admin.com

Pass: admin

## How to run?

### Server

run following command with sbt

```
sbt "run -DfirebaseSecret=firebasekey -DfilepickerSecret=filepickerkey -DfirebaseUrl=http://url-to-your-firebase.com/"
```

### Client

Dev server:

```
npm start
```

Dist:

```
npm run dist
```
