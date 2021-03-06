// module dependencies for api routes
const axios = require("axios");
const cheerio = require("cheerio");
const db = require("../models");

// ============
// ROUTES
// ============

module.exports = function (app) {
// Primary scraping route
app.get("/scrape", function(req, res) {
    // perform an axios call on our Japanese news website
    axios.get("https://japantoday.com/").then(function(response) {
      let $ = cheerio.load(response.data);
  
      // On Japan Times, each article title has an h2 tag with a 'text-xstrong' class on it. We leverage this for article scraping.
      let scrape1 = [];
      $("h2.text-xstrong").each(function(i, element) {
        let article = {};
  
        // Add the text and href of every link, and save them as properties of the result object
        article.title = $(this).children("a").text();
        // The site uses a relative link path in their HREF, so we append the primary site so as to not create a broken URL
        article.link = "https://japantoday.com" + $(this).children("a").attr("href");

        // push all of the article titles and links into one array.
        scrape1.push(article);
  
      });

      let scrape2 = [];

      $("p.mt-10").each(function(i, element) {
        let summary = $(this).text();
        // news articles have text ending with the word 'read'. Let's remove this:
        summary = summary.split("Read");
        summary = summary[0];

        // push all the summaries off of the main page into a separate array to later merge.
        scrape2.push(summary);
      })

      let finalScrape = [];
      for (let i = 0; i < scrape1.length; i++) {
        let current = scrape1[i];
        // combine the summary and the title/link objects into one.
        current.summary = scrape2[i];
        finalScrape.push(current);
        // Finally, create an article using the data that was scraped.
        db.Article.create(current)
          .then(function(dbArticle) {
            // View the added result in the console
            console.log(dbArticle);
          })
          .catch(function(err) {
            // If an error occurred, log it
            console.log(err);
          });
      }
  
      // Send a message to the client
      res.send("Scrape Complete");
    });
  });
  
  // Route for getting all Articles from the db
  app.get("/articles", function(req, res) {
    // Grab every document in the Articles collection
    db.Article.find({})
      .then(function(dbArticle) {
        // If we were able to successfully find Articles, send them back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });
  
  // Route for grabbing a specific Article by id, populate it with it's note
  app.get("/articles/:id", function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({ _id: req.params.id })
      // ..and populate all of the notes associated with it
      .populate("note")
      .then(function(dbArticle) {
        // If we were able to successfully find an Article with the given id, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });
  
  // Route for grabbing a specific Article by id, populate it with it's note
  app.get("/notes/:articleId", function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Note.find({ articleId: req.params.articleId })
      // ..and populate all of the notes associated with it
      // .populate("note")
      .then(function(dbNotes) {
        // If we were able to successfully find an Article with the given id, send it back to the client
        res.json(dbNotes);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

  // Route for deleting a single note
  app.post("/notes/delete/:noteId", function(req, res) {
    db.Note.findOneAndDelete({ _id: req.params.noteId })
    .then(function(dbNotes) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbNotes);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
  })

  app.post("/notes/", function(req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
      .then(function(dbNote) {
        // return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        res.json(dbNote);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });
}