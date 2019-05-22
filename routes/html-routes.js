module.exports = app => {
    // catch all route
    app.get("/", (req, res) => {

            res.render("index");

            });
        }; 
