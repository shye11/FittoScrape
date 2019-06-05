$("#scraper-button").on("click", function() {
    $.ajax({
        url: "/scrape",
        method: "GET"
    }).then(function(res) {
        //need to send scrape completed
    })

});