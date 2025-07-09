import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "1234",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let users = [{ id: 1, name: "Sayeed", color: "teal" }];
let pplname = "Sayeed";

async function getCurrentUser() {
  const result = await db.query("SELECT * FROM family_mem");
  users = result.rows;
  let pplname = "Sayeed";

  return users.find((user) => user.name == pplname);
}
async function checkVisisted() {
  const result = await db.query(
    "SELECT vc.country_code FROM visited_countries vc Join family_mem fm on fm.id = vc.visited_by where fm.name = $1",
    [pplname]
  );
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const currentuser = await getCurrentUser();

  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentuser.color,
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];
  const pplId = await getCurrentUser();
  
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code , visited_by) VALUES ($1 ,$2)",
        [countryCode , pplId.id]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    pplname = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  const newName = req.body.name;
  const newColor = req.body.color;
  await db.query("INSERT INTO family_mem (name, color) VALUES ($1, $2);", [
    newName,
    newColor,
  ]);
  pplname = newName;
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
