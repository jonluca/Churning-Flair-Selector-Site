$(() => {
  init();
});

let fuse = undefined;

function init() {
  registerEventListeners();
  $.ajax({
    method: 'GET',
    url: 'data/out.json',
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

      $("#flair-list").html(generateList(data.map(e => e.iata)));
    }
  });
}

function generateList(list) {
  let elements = "";
  for (const flair of list) {
    elements += `<div data-value="${flair}" class="flair-item">${flair}</div>`;
  }
  return elements;
}

function registerEventListeners() {

  $(document).on('click', '.flair-item', e => {
    let shouldAddClassToTarget = !$(e.target).hasClass('selected');
    $("#save").prop("disabled", !shouldAddClassToTarget);
    $(".selected").removeClass("selected");
    if (shouldAddClassToTarget) {
      $(e.target).addClass('selected');
    }
  });

  $("#filter").on('keyup', _ => {
    $("#save").prop("disabled", true);
    let query = $("#filter").val();
    if (!fuse || !query.length) {
      return;
    }
    let data = fuse.search(query);
    let flairs = data.map(e => e.iata);
    $("#flair-list").html(generateList(flairs));
  });

  $("#save").on('click', _ => {
    let selected = $(".selected");
    if (selected.length !== 1) {
      return;
    }
    let flairSelection = $(selected).text();
    $.ajax({
      method: 'POST',
      url: '/save',
      type: 'json',
      data: {
        flair: flairSelection
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