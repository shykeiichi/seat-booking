import { h, render } from "preact";
import RootComponent, { IRootComponentProps } from "./components/root";

type SeatBookingAttribute = "data-layout" | "data-occupied" | "data-selected-seat" | "data-can-override" | "data-labels";

export default function createSeatBookingClass() {
  return class SeatBooking extends HTMLElement {
    private shadow: Element | ShadowRoot;
    private renderedNode: Element;

    private layout: number[] = [];
    private occupied: string[] = [];
    private labels: string[] = [];
    private canRender: boolean = false;
    private selectedSeat: string = null;
    private canOverride: boolean = false;

    isJsonString(str) {
      try {
          JSON.parse(str);
      } catch (e) {
          return false;
      }
      return true;
    }

    private set layoutAttribute(value: string) {
      if (value == null || !/^\d+(?:\,\d+)*$/.test(value)) {
        throw new Error(
          `Expected attribute data-layout with value '${value}' to be valid (regexp: /^\d+(?:\,\d+)*$/)`
        );
      }
      this.layout = value.split(",")
        .filter(el => el.length > 0)
        .map(str => parseInt(str, 10))
        .filter(el => !isNaN(el));
    }
    private set labelsAttribute(value: string) {
      if (value == null || !this.isJsonString(value)) {
        throw new Error(
          `Expected attribute data-labels with value '${value}' to not be empty and expects to be a json object`
        );
      }
      this.labels = JSON.parse(value);
      console.log(this.labels);
    }
    private set occupiedAttribute(value: string) {
      if (value == null || !/^\d+(?:\,\d+)*$/.test(value)) {
        throw new Error(
          `Expected attribute data-occupied with value '${value}' to be valid (regexp: /^\d+(?:\,\d+)*$/)`
        );
      }
      this.occupied = value.split(",")
        .filter(el => el.length > 0)
        .map(str => parseInt(str, 10))
        .filter(el => !isNaN(el))
        .map(el => el.toString());
    }
    private set selectedSeatAttribute(value: string) {
      if (!/^\d+$/.test(value)) {
        throw new Error(
          `Expected attribute data-selected-seat with value '${value}' to be valid (regexp: /^\d+$/)`
        );
      }
      this.selectedSeat = value;
    }
    private set canOverrideAttribute(value: string) {
      this.canOverride = value === "true";
    }

    static get observedAttributes(): SeatBookingAttribute[] {
      return [
        "data-layout",
        "data-occupied",
        "data-selected-seat",
        "data-can-override",
        "data-labels"
      ];
    }

    private connectedCallback(): void {
      if (!this.shadow) {
        this.shadow = "shadowRoot" in HTMLElement.prototype
          ? this.attachShadow({ mode: "open" }) as Element | ShadowRoot
          : this;
      }

      this.renderedNode = this.renderChildren(this.renderedNode);
      this.canRender = true; // prevent rendering multiple times before this component connects
    }

    private onSeatSelected = (seatId: string): void => {
      this.selectedSeat = seatId;
      this.setAttribute("data-selected-seat", seatId);

      this.dispatchEvent(
        new CustomEvent("seat-selected", {
          detail: {
            seatId,
            isOccupied: this.occupied.indexOf(seatId) >= 0
          }
        })
      );
    }

    private renderChildren(replaceNode?: Element): Element {
      const props: IRootComponentProps = {
        canOverride: this.canOverride,
        layout: this.layout,
        occupied: this.occupied,
        onSeatSelected: this.onSeatSelected,
        selectedId: this.selectedSeat,
        labels: this.labels
      };
      return render(h(RootComponent, props), (this.shadow as Element), this.renderedNode);
    }

    private attributeChangedCallback(attribute: SeatBookingAttribute, oldValue: string, newValue: string) {
      if (attribute === "data-layout") {
        this.layoutAttribute = newValue;
      } else if (attribute === "data-occupied") {
        this.occupiedAttribute = newValue;
      } else if (attribute === "data-selected-seat") {
        this.selectedSeatAttribute = newValue;
      } else if (attribute === "data-can-override") {
        this.canOverrideAttribute = newValue;
      } else if (attribute === "data-labels") {
        this.labelsAttribute = newValue;
      }

      if (this.canRender) {
        this.renderedNode = this.renderChildren(this.renderedNode);
      }
    }
  };
}
