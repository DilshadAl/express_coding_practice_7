const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDBAndServer = async () => {
  try {
    database = open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running");
    });
  } catch (error) {
    console.log(`Data base Error is ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const playerObjectCreate = (eachPlayer) => {
  return {
    playerId: eachPlayer.player_id,
    playerName: eachPlayer.player_name,
  };
};

const matchDetailConverter = (matchDetail) => {
  return {
    matchId: matchDetail.match_id,
    match: matchDetail.match,
    year: matchDetail.year,
  };
};

//API 1

app.get("/players/", async (request, response) => {
  const playerDetailsQuery = `
    SELECT * 
    FROM player_details;`;
  const playerArray = await database.all(playerDetailsQuery);
  response.send(
    playerArray.map((eachPlayer) => playerObjectCreate(eachPlayer))
  );
});

//API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetailQuery = `
    SELECT * 
    FROM player_details 
    WHERE player_id = ${playerId};`;
  const playerDetails = await database.get(playerDetailQuery);
  response.send(playerObjectCreate(playerDetails));
});

//API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateQuery = `
    UPDATE player_details
    SET 
     player_name = ${playerName}
    WHERE player_id = ${playerId};`;
  await database.run(updateQuery);
  response.send("Player Details Updated");
});

//API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailQuery = `
    SELECT *
    FROM match_details
    WHERE match_id = ${matchId};`;
  const matchDetail = await database.get(matchDetailQuery);
  response.send(matchDetailConverter(matchDetail));
});

//API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const matchDetailPlayerQuery = `
    SELECT
    match_id,
    match,
    year
    FROM player_match_score NATURAL JOIN match_details
    WHERE player_id = ${playerId}
    GROUP BY match_id;`;
  const matchArray = await database.all(matchDetailPlayerQuery);
  response.send(matchArray.map((eachMach) => matchDetailConverter(eachMach)));
});

//API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playerDetailQuery = `
    SELECT * 
    FROM player_match_score NATURAL JOIN player_details
    WHERE match_id = ${matchId};`;
  const playerArray = await database.all(playerDetailQuery);
  response.send(
    playerArray.map((eachPlayer) => playerObjectCreate(eachPlayer))
  );
});

//API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playerScoreQuery = `
    SELECT 
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM 
    player_match_score NATURAL JOIN player_details
    WHERE player_id = ${playerId};`;
  const playerScoreArray = await database.get(playerScoreQuery);
  response.send(playerScoreArray);
});

module.exports = app;
