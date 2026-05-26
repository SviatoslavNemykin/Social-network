const csrfToken = document.querySelector("meta[name='csrf-token']").content;

async function handleFriendAction(actionButton) {
  const response = await fetch(actionButton.dataset.url, {
    method: "POST",
    headers: {
      "X-CSRFToken": csrfToken,
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  const data = await response.json();
  console.log(data);
}

function connectFriendActionsButton(parent = document) {
  const actionButtons = parent.querySelectorAll(".friend-action");

  actionButtons.forEach((actionButton) => {
    if (!actionButton.dataset.hasEvent) {
      actionButton.dataset.hasEvent = "true";

      actionButton.addEventListener("click", async () => {
        await handleFriendAction(actionButton);
      });
    }
  });
}

connectFriendActionsButton();