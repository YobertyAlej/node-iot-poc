# Node.js IoT Proof of Concept

⚠️ Warning ⚠️

This is a **PROOF OF CONCEPT** ️🏃🔥‍⚗️, and it's still not suitable for a production enviroment

A simple Node.js IoT Platform, it handles the *Metrics* send by an *Agent* connected to a sensor using libraries like *Jhonny5*

This platform controls the data flow, storage, deliver and real-time connection to an end device such as a web dashboard or any device that can consume a JSON API

## Modules

* Agent

    Handles the logic for the device sending metrics, can be run through a low consume CPU such as the BeagleBone Black or Raspberry PI
* API

    JSON API server to deliver the Agent Metrics
* DB

    DB Module to handle the Entities in our IoT Platform using Sequelize ORM
* MQTT

    MQTT Server to broadcast the agents metrics into our db using mosca

* Web

    Real-time dashboard to monitor the metrics

## Credits

Heavily inspired by @julianduque