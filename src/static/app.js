document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="spots-left">${spotsLeft}</span> spots left</p>
        `;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        participantsSection.appendChild(participantsHeading);

        const participantsList = document.createElement("ul");
        const addParticipantRow = (participant) => {
          const participantItem = document.createElement("li");
          participantItem.className = "participant-row";

          const participantEmail = document.createElement("span");
          participantEmail.textContent = participant;
          participantItem.appendChild(participantEmail);

          const unregisterButton = document.createElement("button");
          unregisterButton.type = "button";
          unregisterButton.className = "remove-participant";
          unregisterButton.setAttribute("aria-label", `Unregister ${participant}`);
          unregisterButton.title = "Unregister participant";
          unregisterButton.innerHTML = `
            <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
              <path d="M3 6h18M8 6V4h8v2m2 0-1 14H7L6 6m4 4v7m4-7v7" />
            </svg>
          `;
          unregisterButton.addEventListener("click", async () => {
            unregisterButton.disabled = true;

            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(participant)}`,
                { method: "DELETE" }
              );
              const result = await response.json();

              if (!response.ok) {
                throw new Error(result.detail || "Failed to unregister participant");
              }

              const participantIndex = details.participants.indexOf(participant);
              if (participantIndex !== -1) {
                details.participants.splice(participantIndex, 1);
              }
              participantItem.remove();
              activityCard.querySelector(".spots-left").textContent =
                details.max_participants - details.participants.length;

              if (participantsList.children.length === 0) {
                const emptyMessage = document.createElement("li");
                emptyMessage.className = "empty-participants";
                emptyMessage.textContent = "No participants yet";
                participantsList.appendChild(emptyMessage);
              }
            } catch (error) {
              messageDiv.textContent = error.message || "Failed to unregister participant";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
              setTimeout(() => messageDiv.classList.add("hidden"), 5000);
              unregisterButton.disabled = false;
            }
          });

          participantItem.appendChild(unregisterButton);
          participantsList.appendChild(participantItem);
        };

        if (details.participants.length === 0) {
          const emptyMessage = document.createElement("li");
          emptyMessage.className = "empty-participants";
          emptyMessage.textContent = "No participants yet";
          participantsList.appendChild(emptyMessage);
        } else {
          details.participants.forEach(addParticipantRow);
        }
        participantsSection.appendChild(participantsList);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
