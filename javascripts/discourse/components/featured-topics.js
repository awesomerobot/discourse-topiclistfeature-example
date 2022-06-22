import Component from "@ember/component";
import { computed } from "@ember/object";
import { inject as controller } from "@ember/controller";
import discourseComputed, { observes } from "discourse-common/utils/decorators";
import { inject as service } from "@ember/service";

export default Component.extend({
  router: service(),
  tagName: "",
  category: computed("this.router", function () {
    return this.router.currentRoute
      ? this.router.currentRoute.attributes.category
      : null;
  }),

  didInsertElement() {
    this._super(...arguments);
    this._updateBodyClasses();
    this.appEvents.on("page:changed", this, "_getTopics");
  },

  willDestroyElement() {
    this.appEvents.off("page:changed", this, "_getTopics");
    document.body.classList.remove("custom-topic-lists");
  },

  _getTopics() {
    // reset topic lists so content doesn't carry over
    this.set("topicList1", null);
    this.set("topicList2", null);
    this.set("topicList3", null);

    if (!this.isDestroyed || this.isDestroying) {
      let getFeaturedTopics = (tagName, propName) => {
        this.store
          .findFiltered("topicList", {
            filter: "latest",
            params: {
              tags: [tagName],
            },
          })
          .then((topicList) => {
            this.set(propName, topicList.topics.slice(0, 3));
            this.set("isLoading", false);
          });
      };

      if (this.filteredSetting) {
        let tag1 = this.filteredSetting.topic_list_tag_1;
        let tag2 = this.filteredSetting.topic_list_tag_2;
        let tag3 = this.filteredSetting.topic_list_tag_3;

        this.set("tag1", tag1);
        this.set("tag2", tag2);
        this.set("tag3", tag3);

        getFeaturedTopics(tag1, "topicList1");
        getFeaturedTopics(tag2, "topicList2");
        getFeaturedTopics(tag3, "topicList3");
      }

    } else {
      this._updateBodyClasses();
    }
  },

  @discourseComputed("router.currentRoute")
  filteredSetting(router) {
    const parsedSetting = JSON.parse(settings.category_topic_lists);
    let filteredSetting;

    if (router?.attributes?.category) {
      filteredSetting = parsedSetting.filter(
        (entry) => parseInt(entry.category) === router.attributes.category.id
      )[0];
    }
    return filteredSetting;
  },

  @observes("shouldShow")
  _updateBodyClasses() {
    if (this.shouldShow && this.category) {
      document.body.classList.add("custom-topic-lists");
    } else {
      document.body.classList.remove("custom-topic-lists");
    }

  },

  @discourseComputed("router.currentRouteName")
  shouldShow(currentRouteName) {
    return this.filteredSetting && currentRouteName === "discovery.category";
  },
});
