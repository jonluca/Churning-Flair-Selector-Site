$(() => {
  registerClickHandlers();
  loadPosts();
  var timepicker = new TimePicker(['#time'], {
    theme: 'dark', // or 'blue-grey'
    lang: 'en' // 'en', 'pt' for now
  });
  timepicker.on('change', function (evt) {
    var value = (evt.hour || '00') + ':' + (evt.minute || '00');
    evt.element.value = value;
  });
});
let posts;

function loadPosts() {
  $.ajax({
    method: 'GET',
    url: '/admin/posts',
    type: 'json',
    success(data, textStatus, jqXHR) {
      if (!data) {
        console.error("Error loading posts!");
        return;
      }
      posts = data;
      let list = '';
      for (const post of data) {
        let safeTitle = $('<div>').text(post.title).html();
        list += `<li class="post" data-id="${post.id}">${safeTitle}<icon class="delete-post" data-id="${post.id}">X</icon></li>`;
      }
      $("#posts").html(list);
    }
  });
}

function loadPostToEdit(post) {
  $("#title").val(post.title);
  $("#title").attr('data-id', post.id);
  $("#body").text(post.body);
  if (post.frequency === "ALL") {
    $("#frequency").val("Daily");
    $("#day-container").hide();
  } else {
    $("#frequency").val("Weekly");
    $("#day-container").show();
    $("#day").val(post.frequency);
  }
  $("#time").val(post.time);
}

function registerClickHandlers() {
  $(document).on('click', '.post', e => {
    let id = $(e.target).attr('data-id');
    $(".hidden").removeClass('hidden');
    id = parseInt(id);
    for (const post of posts) {
      if (post.id === id) {
        loadPostToEdit(post);
        return;
      }
    }
  });

  $(document).on('click', '.delete-post', e => {
    let id = $(e.target).attr('data-id');
    swal({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.value) {
        deletePostById(id);
      }
    });
  });

  $("#frequency").on('change', e => {
    if (e.target.value === "Weekly") {
      $("#day-container").show();
    } else {
      $("#day-container").hide();
    }
  });

  $("#new").on('click', e => {
    e.preventDefault();
    $(".hidden").removeClass('hidden');
    $("#title").attr('data-id', '0');
    $("#title").val("");
    $("#body").val("");
  });

  $("#save").on('click', e => {
    e.preventDefault();
    const id = parseInt($("#title").attr('data-id'));
    let body = $("#body").val();
    let frequency = "ALL";
    if ($("#frequency").val() === "Weekly") {
      frequency = $("#day").val();
    }
    let title = $("#title").val();
    let time = $("#time").val();
    if (!body || !frequency || !title || !time) {
      swal("Error!", "Invalid post!", "error");
      return;
    }
    if (id === 0) {
      createNewPost(title, body, frequency, time);
    } else {
      updatePost(title, body, frequency, time, id);
    }
  });
}

function updatePost(title, body, frequency, time, id) {
  $.ajax({
    method: 'POST',
    url: '/admin/posts/update',
    type: 'json',
    data: {
      body,
      title,
      frequency,
      time,
      id
    },
    success(data, textStatus, jqXHR) {
      if (jqXHR.status !== 200) {
        swal("Error!", "Invalid post!", "error");
        return;
      }
      swal("Success!", "Post successfully updated!", "success");
      loadPosts();
    }
  });
}

function createNewPost(title, body, frequency, time) {
  $.ajax({
    method: 'POST',
    url: '/admin/posts/new',
    type: 'json',
    data: {
      body,
      title,
      frequency,
      time
    },
    success(data, textStatus, jqXHR) {
      if (jqXHR.status !== 200) {
        swal("Error!", "Invalid post!", "error");
        return;
      }
      swal("Success!", "New scheduled post successfully created!", "success");
      loadPosts();
    }
  });
}

function deletePostById(id) {
  $.ajax({
    method: 'DELETE',
    url: '/admin/posts/post',
    type: 'json',
    data: {
      id
    },
    success(data, textStatus, jqXHR) {
      if (jqXHR.status !== 200) {
        swal("Error!", "Invalid post!", "error");
        return;
      }
      swal("Success!", "Successfully deleted post!", "success");
      loadPosts();
    }
  });
}