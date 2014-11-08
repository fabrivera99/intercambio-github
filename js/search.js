$(document).ready(function () {
    $("#search-btn").click(function () {
        alert( $('#listview_data').data("filter") ); // alerts "false"
        $('#listview_data').data("filter",true);
        alert( $('#listview_data').data("filter") ); // alerts "false"

    });
});