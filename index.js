import express, { application } from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import rateLimit from 'express-rate-limit'; // Importa o rate limiter

const api_key = process.env.API_KEY;
const app = express();
const port = 3000;


// const game_test = "metroid prime"

// var url = "https://www.giantbomb.com/api/search/?api_key="+api_key+"&format=json&query=%22"+game_test+"%22&resources=game"

var games = ""
var url = ""
// let gameData = null;
let gameID = null;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Configuração do Rate Limiter
const limiter = rateLimit({
    windowMs: 60 * 10000, // 10 minuto
    max: 30, // Máximo de 20 requisições por IP
    message: "Limite de requisições atingido. Tente novamente mais tarde.",
    headers: true, // Retorna headers informando o limite
});

// Aplica o rate limiter apenas nas rotas que fazem chamadas à API externa
app.use('/search', limiter);
app.use('/game-details', limiter);
app.use('/random', limiter);




app.get('/', async (req, res) => {
    res.render('index.ejs', { games: games });
    console.log("Home page loaded");
    games = "";
    // console.log(url);
    // const response = await axios.get(url);
    // const result = response.data;
    // console.log(result.results[0]);
    }
); 

app.get('/reset', async (req, res) => {
    games = "";
    gameID = null;
    res.redirect("/");
    console.log("Reset complete");
});

app.get('/game-details', async(req, res) => {
    
    const game_url = "https://www.giantbomb.com/api/game/"+gameID+"/?api_key="+api_key+"&format=json"
    console.log('game_url: ', game_url);
    try {
    const response = await axios.get(game_url);
    const gameData = response.data.results;
    // console.log(gameData);
    res.render('game-details.ejs', { game: gameData });
    console.log("Game details loaded :", gameData.name);
    }
    catch (error) {
        console.error("Failed to make request:", error.message);
        res.render('game-details.ejs', {
            error: error.message,
        });
    }
});


app.get('/random', async (req, res) => {
    try {
        let gameExists = false;
        let gameData = null;
        let attempts = 0;

        while (!gameExists && attempts < 5) {
            const random_id = Math.floor(Math.random() * 99999) + 1;
            const testGameID = "3030-" + random_id;
            console.log("Tentando ID:", testGameID);

            const game_url = `https://www.giantbomb.com/api/game/${testGameID}/?api_key=${api_key}&format=json`;
            console.log("testando o game_url: ", game_url);
            try {
                const response = await axios.get(game_url);
                if (response.data.results.name) {
                    gameExists = true;
                    gameID = testGameID;
                    gameData = response.data.results;
                }
                else {
                    console.log("Jogo não encontrado:", testGameID);
                }
            } catch (error) {
                console.warn(`Erro ao buscar ID ${testGameID}:`, error.message);
            }

            attempts++;
        }

        if (gameExists) {
            console.log("Jogo encontrado:", gameID);
            res.render('game-details.ejs', { game: gameData });
        } else {
            console.log("Nenhum jogo encontrado após 5 tentativas.");
            res.redirect("/");
        }
    } catch (error) {
        console.error("Erro ao buscar jogo aleatório:", error.message);
        res.redirect("/");
    }
});




app.post("/search", async (req, res) => {
    try {
        const game = req.body.search;
        url = `https://www.giantbomb.com/api/search/?api_key=${api_key}&format=json&query="${game}"&resources=game`;
        
        const response = await axios.get(url);
        const result = response.data;

        
        if (result.results && result.results.length > 0) {
            games = result.results;
            // console.log(games[0].name); 
        } else {
            games = [];
            console.log("Nenhum jogo encontrado.");
        }

        res.redirect("/");
        console.log("Search complete, url= ", url);
    } catch (error) {
        console.error("Erro ao buscar dados:", error.message);
        res.redirect("/");
    }
});

app.post("/select-game", (req, res) => {
    try {
        // gameData = req.body.gameData;

        // Caso gameData esteja como "[Object object]", faça um log para diagnóstico
        // console.log("Recebido do front-end:", gameData);
        // gameData = JSON.parse(gameData);
        // console.log("Jogo selecionado:", gameData);
        gameID = req.body.gameID;
        console.log("Game ID:", gameID);
        res.redirect("/game-details");

        // Verifica se a string está realmente em formato JSON antes de tentar fazer parse
        // if (typeof gameData === "string" && gameData.startsWith("{")) {
        //     gameData = JSON.parse(gameData);
        //     console.log("Jogo selecionado:", gameData);
        //     res.redirect(`/game-details?name=${encodeURIComponent(gameData.name)}`);
        // } else {
        //     console.error("Erro: Dados recebidos não são um JSON válido.");
        //     res.redirect("/");
        // }
    } catch (error) {
        console.error("Erro ao processar o jogo selecionado:", error);
        res.redirect("/");
    }
});




app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}
);