import Quill from "quill";

const BlockEmbed = Quill.import("blots/block/embed") as any;

class ImagePairBlot extends BlockEmbed {
  static blotName = "imagePair";
  static tagName = "div";
  static className = "image-pair";

  static create(value: { left: string; right: string }) {
    const node = super.create();
    node.innerHTML = `
      <img src="${value.left}" class="image-left" />
      <img src="${value.right}" class="image-right" />
    `;
    return node;
  }

  static value(node: HTMLElement) {
    const imgs = node.querySelectorAll("img");
    return {
      left: imgs[0]?.getAttribute("src") || "",
      right: imgs[1]?.getAttribute("src") || "",
    };
  }
}

Quill.register(ImagePairBlot);
