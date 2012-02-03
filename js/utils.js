function loadFileBuffer(url, callback){
    var isError = false;
    $.ajax({
        type: "GET",
        url: url,
        beforeSend: function(xhr){
            xhr.responseType = 'arraybuffer';
            isError = false;
        },
        success: function(data){
            
        },
        error: function(xhr){
            if(xhr.status === 403) isError = true;
        },
        complete: function(xhr){
            if(!isError) callback(xhr.response);
            else {
                throw 'Error: 403';
            }
        }
    });
}

function createNotification(title, body){
    return webkitNotifications.createNotification("../img/48.png", title, body);
}