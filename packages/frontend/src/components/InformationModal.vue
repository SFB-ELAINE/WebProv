<template>
  <b-modal :active="value" @update:active="input" :width="640" scroll="keep">
    <div class="card">
      <div class="card-content">
        <h1>
          Creating Links
        </h1>
        <p>To create a link, right-click and hold on a node and then drag your mouse to another node. Once your mouse is over the desired node, release your right-click. When you drag your mouse over nodes, they will be highlighted either green or red. If the node turns red, this means that the connection between the two selected nodes is not valid. Likewise, if the node turns green, this indicates a valid connection.</p>

        <h1>
          Creating Nodes
        </h1>
        <p>To create a node, just click on the "Add Node" button located on the top-right of the screen. If you don't see this button, make sure to use enable mode by clicking the "Show Editor Tools" button. This will create a new node and automatically save it to the database.</p>

        <h1>
          Editing Nodes
        </h1>
        <p>To edit a node, just click a node that is shown in the graph. This will open up a form card that has all of the avaiable fields. When editing, your changes will be automatically saved to the database. Note, it is not possible to edit a contracted study node.</p>

        <h1>
          Editing Studies
        </h1>
        <p>To edit a study, click on the convex hull that is being displayed in the graph. This is the colored structure that encloses a set of nodes. After clicking on the hull, a card will appear with several editable fields.</p>

        <h1>
          Panning
        </h1>
        <p>Panning can be controlled by clicking or pressing on the background of the visualization and dragging.</p>

        <h1>
          Zooming
        </h1>
        <p>Zooming can be accomplished using a mouse wheel or pinching with two fingers on a trackpad or touchscreen.</p>
      </div>
    </div>
  </b-modal>
</template>

<script lang="ts">
import { createComponent } from '../utils';

export default createComponent({
  props: {
    value: { type: Boolean, required: true },
  },
  setup(_, context) {
    return {
      input(value: boolean) {
        context.emit('input', value);
      },
    };
  },
});
</script>

<style lang="scss" scoped>
.card-content {
  text-align: left;
}

h1 {
  font-weight: bold;
}

h1:not(:first-child) {
  margin-top: 10px;
}
</style>
