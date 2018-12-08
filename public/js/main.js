$(() => {
  init();
});

let fuse = undefined;

function init() {
  registerEventListeners();
  $.ajax({
    method: 'GET',
    url: 'data/flairs.json',
    type: 'json',
    success(data, textStatus, jqXHR) {
      if (!data) {
        console.error("Error loading flair json");
        return;
      }
      const options = {
        shouldSort: true,
        threshold: 0.6,
        location: 0,
        distance: 100,
        findAllMatches: false,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        keys: [
          "iata",
          "name",
          "city"
        ]
      };
      fuse = new Fuse(data, options); // "list" is the item array

      $("#flair-list").html(generateList(data));
    }
  });
}

function generateList(list) {
  let elements = "";
  for (const flair of list) {
    let currentClass = "flair-item";
    if (flair.iata === $("#first-flair").text() || flair.iata === $("#second-flair").text()) {
      currentClass += " selected";
    }
    elements += `<div data-value="${flair.iata}" class="${currentClass}">${flair.iata} - ${flair.name}</div>`;
  }
  return elements;
}

function registerEventListeners() {

  $(document).on('click', '.flair-item', e => {
    // Highlight in red in list
    $(e.target).addClass('selected');
    // Set top box values to selection
    let flair = $(e.target).attr('data-value');
    if (!$("#first-flair").text()) {
      $("#first-flair").text(flair);
      // Don't allow both first and second flair to be the same
      if ($("#second-flair").text() === flair) {
        $("#second-flair").text("");
      }
    } else {
      $("#second-flair").text(flair);
      // Don't allow both first and second flair to be the same
      if ($("#first-flair").text() === flair) {
        $("#first-flair").text("");
      }
    }
    resetHighlightedFlairsInList();
    resetSaveDisabledStatus();
  });

  $(".clear-link").on('click', e => {
    let flair = $(e.target).prev();
    $(flair).text("");
    resetHighlightedFlairsInList();
    resetSaveDisabledStatus();
  });

  $("#filter").on('keyup', _ => {
    let query = $("#filter").val();
    if (!fuse || !query.length) {
      return;
    }
    let data = fuse.search(query);
    $("#flair-list").html(generateList(data));
    resetSaveDisabledStatus();
    resetHighlightedFlairsInList();
  });

  $("#save").on('click', _ => {
    let firstFlairSelection = $("#first-flair").text();
    let secondFlairSelection = $("#second-flair").text();
    if (!firstFlairSelection && !secondFlairSelection) {
      return;
    }
    let flair = firstFlairSelection || secondFlairSelection;
    if (firstFlairSelection && secondFlairSelection) {
      flair = firstFlairSelection + "," + secondFlairSelection;
    }

    $.ajax({
      method: 'POST',
      url: '/save',
      type: 'json',
      data: {
        flair: flair
      },
      success(data, textStatus, jqXHR) {
        swal("Success!", "Your flair should be updated in the next 15 minutes!", "success");
      },
      error(jqXHR, textStatus) {
        if (jqXHR.status === 403) {
          swal("Error!", "Invalid flair selection!", "error");
        } else if (jqXHR.status === 500) {
          swal("Error!", "Server error requesting profile information!", "error");
        } else {
          swal("Error!", "An unknown error occurred!", "error");
        }
        console.error(textStatus);
      }
    });
  });
}

function resetSaveDisabledStatus() {
  if ($("#first-flair").text() || $("#second-flair").text()) {
    $("#save").prop("disabled", false);
  } else {
    $("#save").prop("disabled", true);
  }
}

function resetHighlightedFlairsInList() {
  $(".selected").removeClass("selected");
  const firstFlair = $('#first-flair').text();
  const secondFlair = $('#second-flair').text();
  if (firstFlair) {
    $(`[data-value='${firstFlair}']`).addClass("selected");
  }
  if (secondFlair) {
    $(`[data-value='${secondFlair}']`).addClass("selected");
  }
}