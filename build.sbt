name := "victorious-pirate"

version := "1.0-SNAPSHOT"

lazy val root = (project in file(".")).enablePlugins(PlayJava)

scalaVersion := "2.11.7"

libraryDependencies ++= Seq(
  javaJdbc,
  cache,
  javaWs,
  "org.apache.poi" % "poi" % "3.14",
  "org.apache.poi" % "poi-ooxml" % "3.14",
  "com.firebase" % "firebase-client-jvm" % "2.5.2",
  "com.google.guava" % "guava" % "19.0"
)

unmanagedResourceDirectories in Assets += baseDirectory.value / "frontend" / "dist"