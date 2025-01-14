module DiscourseElections
  class Nomination
    # nominations_usernames
    # [
    # {
    #   username: "user1"
    #   description: 'description1',
    # },
    # {
    #   username: "user2"
    #   description: 'description2',
    # }
    # ]
    def self.set_by_username(topic_id, nominations_usernames)
      topic = Topic.find(topic_id)
      existing_nominations = topic.election_nominations
      existing_nominations_usernames = topic.election_nominations_usernames

      # new_nominations_usernames = []

      pp "################ set_by_username #{nominations_usernames}"

      # if nominations_usernames.present?
      #   nominations_usernames.each do |u|
      #     pp "############## user #{u}"
      #     if u.present? && u["username"].present?
      #       user = User.find_by(username: u["username"])
      #       if user
      #         new_nominations_usernames.push(u.dup.merge(id: user.id))
      #       else
      #         raise StandardError.new I18n.t("election.errors.user_was_not_found", user: u)
      #       end
      #     end
      #   end
      # end

      existing_nominations_usernames.uniq! 
      nominations_usernames.uniq!
      
      new_nominations_usernames = rebuild_nominations_usernames(existing_nominations_usernames, nominations_usernames: nominations_usernames)

      pp new_nominations_usernames
      pp existing_nominations_usernames

      if Set.new(existing_nominations_usernames) == Set.new(new_nominations_usernames)
        raise StandardError.new I18n.t("election.errors.nominations_not_changed")
      end

      pp "##################### existing_nominations #{existing_nominations}"
      pp "##################### existing_nominations_usernames #{existing_nominations_usernames}"

      saved = false
      # existing_nominations_ids = existing_nominations_usernames.map { |u|
      #   begin u['id'] rescue nil end
      # }.filter(&:present?).sort!
      new_nominations =
        new_nominations_usernames
          .map { |u| u.present? ? u["id"] : nil }          
          .filter(&:present?)
          .sort!

      pp "##################### new_nominations #{new_nominations}"
      pp "##################### new_nominations_usernames #{new_nominations_usernames}"

      TopicCustomField.transaction do
        if saved = Nomination.save(topic, new_nominations, new_nominations_usernames)
          # only
          removed_nomination_ids =
            existing_nominations.reject { |n| !n || new_nominations.include?(n.to_i) }

          added_nomination_ids =
            new_nominations.reject { |u| !u || existing_nominations.include?(u.to_i) }

          pp "##################### set_by_username[1] #{removed_nomination_ids} #{added_nomination_ids}"

          Nomination.handle_new(topic, added_nomination_ids) if added_nomination_ids.any?
          pp "##################### set_by_username[2]"

          Nomination.handle_remove(topic, removed_nomination_ids) if removed_nomination_ids.any?
          pp "##################### set_by_username[3]"
        end
      end

      if !saved || topic.election_post.errors.any?
        pp "##################### set_by_username[4] #{saved}"
        pp topic.election_post.errors.full_messages
      end

      # post refresh
      DiscourseElections::ElectionPost.rebuild_election_post(topic)

      # example of return values
      # {
      #   id: 1,
      #   username: "user1"
      #   description: 'description1',
      # },
      # {
      #   id: 22,
      #   username: "user2"
      #   description: 'description2',
      # }

      new_nominations_usernames
    rescue StandardError => e
      puts e.message
      puts e.backtrace.join("\n") if Rails.env.development?
      raise
    end

    def self.add_user(topic_id, user_id)
      pp "################ add_user : #{topic_id}, #{user_id}"

      topic = Topic.find(topic_id)
      nominations = topic.election_nominations
      nominations_usernames = topic.election_nominations_usernames
      added_user_ids = [user_id]

      if !nominations.include?(user_id)
        nominations.push(user_id)
        nominations_usernames =
          rebuild_nominations_usernames_by_id(nominations_usernames, added_user_ids: added_user_ids)
      end

      saved = false
      TopicCustomField.transaction do
        if saved = Nomination.save(topic, nominations, nominations_usernames)
          Nomination.handle_new(topic, added_user_ids)
        end
      end

      if !saved || topic.election_post.errors.any?
        raise StandardError.new I18n.t("election.errors.set_nominations_failed")
      end

      nominations
    end

    def self.remove_user(topic_id, user_id)
      pp "################ remove_user : #{topic_id}, #{user_id}"

      topic = Topic.find(topic_id)
      nominations = topic.election_nominations
      nominations_usernames = topic.election_nominations_usernames
      removed_user_ids = [user_id]

      if nominations.include?(user_id)
        nominations = topic.election_nominations - removed_user_ids
        nominations_usernames =
          rebuild_nominations_usernames_by_id(
            topic.election_nominations_usernames,
            removed_user_ids: removed_user_ids,
          )
      end

      saved = false
      TopicCustomField.transaction do
        if saved = Nomination.save(topic, nominations, nominations_usernames)
          Nomination.handle_remove(topic, removed_user_ids)
        end
      end

      if !saved || topic.election_post.errors.any?
        raise StandardError.new I18n.t("election.errors.set_nominations_failed")
      end

      nominations
    end

    def self.save(topic, nominations, nominations_usernames)
      nominations = nominations.uniq
      nominations_usernames = nominations_usernames.uniq

      pp "################ save nominations : #{nominations}, #{nominations_usernames}"
      topic.custom_fields["election_nominations"] = nominations
      topic.custom_fields["election_nominations_usernames"] = nominations_usernames
      topic.save_custom_fields(true)
    end

    # removed_nominations: ids of new nominations
    def self.handle_new(topic, new_nomination_ids, rebuild_post: false)
      existing_statements = NominationStatement.retrieve(topic.id, new_nomination_ids)

      if existing_statements.any?
        existing_statements.each { |statement| NominationStatement.update(statement, false) }
      end

      ElectionPost.rebuild_election_post(topic) if rebuild_post

      if topic.election_nominations.length >= topic.election_poll_open_after_nominations
        ElectionTime.set_poll_open_after(topic)
      end
    end

    # removed_nominations: ids of removed nominations
    def self.handle_remove(topic, removed_nomination_ids, rebuild_post: false)
      topic.reload.election_nominations

      NominationStatement.remove(topic, removed_nomination_ids, false)

      ElectionPost.rebuild_election_post(topic) if rebuild_post

      if topic.election_nominations.length < topic.election_poll_open_after_nominations
        ElectionTime.cancel_scheduled_poll_open(topic)
      end
    end

    def self.set_self_nomination(topic_id, state)
      topic = Topic.find(topic_id)
      topic.custom_fields["election_self_nomination_allowed"] = state
      result = topic.save!

      ElectionTopic.refresh(topic_id)

      topic.custom_fields["election_self_nomination_allowed"]
    end

    def self.notify_nominees(topic_id, type)
      Jobs.cancel_scheduled_job(:election_notify_nominees, topic_id: topic_id, type: "poll")
      Jobs.cancel_scheduled_job(:election_notify_nominees, topic_id: topic_id, type: "closed_poll")
      Jobs.enqueue_in(1.hour, :election_notify_nominees, topic_id: topic_id, type: type)
    end

    # @params current_nominations_usernames : [{id: 1, username: 'user1', descritpion: 'description1'}, {id: 2, username: 'user2', descritpion: 'description2'}]
    # (id: is optional)
    # @params nominations_usernames  (user input parameters from ui)
    # [{"username"=>"user1", "description"=>"desctiption"}, {"username"=>"user2", "description"=>"desctiption"}]    
    def self.rebuild_nominations_usernames(current_nominations_usernames, nominations_usernames: [])

      current_nominations_usernames ||= []

      added_usernames = nominations_usernames.reject { |x| 
        current_nominations_usernames.any? { |y| y["username"] == x["username"] } 
      }
      removed_usernames = current_nominations_usernames.reject { |x|
        nominations_usernames.any? { |y| y["username"] == x["username"] }
      }

      pp "################ rebuild_nominations_usernames current_nominations_usernames #{current_nominations_usernames}"
      pp "################ rebuild_nominations_usernames added_usernames #{added_usernames}"
      pp "################ rebuild_nominations_usernames removed_usernames #{removed_usernames}"

      new_nominations_usernames = []

      current_nominations_usernames.each do |u|
        if u.present? && u["username"].present?
          user = User.find_by(username: u["username"])
          unless removed_usernames.include?(u["username"])
            if user
              new_nominations_usernames.push(u.dup.merge(id: user.id))
            else
              raise StandardError.new I18n.t("election.errors.user_was_not_found", user: u)
            end
          end
        end
      end

      added_usernames.each do |u|
        user = User.find_by(username: u["username"])
        if user
          item = { id: u["id"], username: u["username"], description: u["description"] }
          new_nominations_usernames.push(item)
        else
          raise StandardError.new I18n.t("election.errors.user_was_not_found", user: u)
        end
      end

      # description을 변경 사항 복사해줌. 
      new_nominations_usernames = new_nominations_usernames.map do |userinfo|
        nominations_usernames.each do |u|
          if userinfo["username"] == u["username"]
            userinfo["description"] = u["description"]
          end
        end
        userinfo
      end

      new_nominations_usernames
    end

    # @params current_nominations_usernames : [{id: 1, username: 'user1', descritpion: 'description1'}, {id: 2, username: 'user2', descritpion: 'description2'}]
    # (id: is optional)
    # @params added_user_ids [1, 3]
    # @params removed_user_ids [2, 4]
    def self.rebuild_nominations_usernames_by_id(
      current_nominations_usernames,
      added_user_ids: [],
      removed_user_ids: []
    )
      new_nominations_usernames = []

      if current_nominations_usernames.present?
        current_nominations_usernames.each do |u|
          if u.present? && u["username"].present?
            user = User.find_by(username: u["username"])
            unless removed_user_ids.include?(user.id)
              if user.present?
                new_nominations_usernames.push(u.dup.merge(id: user.id))
              else
                raise StandardError.new I18n.t("election.errors.user_was_not_found", user: u)
              end
            end
          end
        end

        added_user_ids.each do |id|
          user = User.find_by(id: id)
          if user
            item = { id: id, username: user["username"], description: "" }
            new_nominations_usernames.push(item)
          else
            raise StandardError.new I18n.t("election.errors.user_was_not_found", user: id)
          end
        end
      end

      new_nominations_usernames
    end
  end
end
