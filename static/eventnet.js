document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("[data-vote-group]").forEach(function (group) {
    var countEl = group.querySelector("[data-vote-count]");
    if (!countEl) return;
    var upBtn = group.querySelector("[data-vote='up']");
    var downBtn = group.querySelector("[data-vote='down']");
    var count = parseInt(countEl.textContent, 10) || 0;
    var state = "none";

    function sync(next) {
      if (next === state) {
        if (state === "up") count -= 1;
        if (state === "down") count += 1;
        state = "none";
      } else {
        if (state === "up") count -= 1;
        if (state === "down") count += 1;
        if (next === "up") count += 1;
        if (next === "down") count -= 1;
        state = next;
      }
      countEl.textContent = String(count);
      if (upBtn) upBtn.classList.toggle("active", state === "up");
      if (downBtn) downBtn.classList.toggle("active", state === "down");
    }

    if (upBtn) upBtn.addEventListener("click", function () { sync("up"); });
    if (downBtn) downBtn.addEventListener("click", function () { sync("down"); });
  });

  var openLeft = document.getElementById("enOpenLeft");
  var openRight = document.getElementById("enOpenRight");
  var leftDrawer = document.getElementById("enLeftDrawer");
  var rightDrawer = document.getElementById("enRightDrawer");

  if (openLeft && leftDrawer) {
    openLeft.addEventListener("click", function () {
      leftDrawer.classList.toggle("open");
      if (rightDrawer) rightDrawer.classList.remove("open");
    });
  }
  if (openRight && rightDrawer) {
    openRight.addEventListener("click", function () {
      rightDrawer.classList.toggle("open");
      if (leftDrawer) leftDrawer.classList.remove("open");
    });
  }

  document.querySelectorAll("[data-tab-target]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = btn.getAttribute("data-tab-target");
      document.querySelectorAll(".en-tab-btn").forEach(function (el) {
        el.classList.remove("active");
      });
      document.querySelectorAll(".en-tab-panel").forEach(function (el) {
        el.classList.remove("active");
      });
      btn.classList.add("active");
      var panel = document.getElementById(target);
      if (panel) panel.classList.add("active");
    });
  });
});
