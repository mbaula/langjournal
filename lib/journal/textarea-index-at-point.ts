const MIRROR_STYLE_PROPS = [
  "direction",
  "boxSizing",
  "width",
  "height",
  "overflowX",
  "overflowY",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "lineHeight",
  "fontFamily",
  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration",
  "letterSpacing",
  "wordSpacing",
  "tabSize",
] as const;

function applyMirrorStyles(
  textarea: HTMLTextAreaElement,
  mirror: HTMLDivElement,
) {
  const computed = window.getComputedStyle(textarea);
  for (const prop of MIRROR_STYLE_PROPS) {
    mirror.style.setProperty(
      prop.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`),
      computed.getPropertyValue(
        prop.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`),
      ),
    );
  }

  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";
  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.top = "0";
  mirror.style.left = "-9999px";
  mirror.style.width = `${textarea.clientWidth}px`;
}

function getCaretCoordinates(
  textarea: HTMLTextAreaElement,
  mirror: HTMLDivElement,
  position: number,
) {
  applyMirrorStyles(textarea, mirror);
  mirror.textContent = textarea.value.slice(0, position);

  const marker = document.createElement("span");
  marker.textContent = textarea.value.slice(position) || ".";
  mirror.appendChild(marker);

  const top = marker.offsetTop;
  const left = marker.offsetLeft;
  const height = marker.offsetHeight;

  mirror.textContent = "";

  return { top, left, height };
}

/** Maps pointer coordinates to a character index in a textarea. */
export function getTextareaIndexAtPoint(
  textarea: HTMLTextAreaElement,
  clientX: number,
  clientY: number,
): number | null {
  const rect = textarea.getBoundingClientRect();
  if (
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom
  ) {
    return null;
  }

  const mirror = document.createElement("div");
  document.body.appendChild(mirror);

  try {
    const x = clientX - rect.left + textarea.scrollLeft;
    const y = clientY - rect.top + textarea.scrollTop;

    let low = 0;
    let high = textarea.value.length;

    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      const coords = getCaretCoordinates(textarea, mirror, mid);
      if (coords.top < y || (coords.top === y && coords.left < x)) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    return low;
  } finally {
    mirror.remove();
  }
}
