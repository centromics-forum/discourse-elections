module Jobs
  class ElectionOpenPoll < Jobs::Base
    def execute(args)
      topic = Topic.find(args[:topic_id])

      if SiteSetting.elections_enabled
        if topic && !topic.closed
          error = nil

          # 선거를 실행하려면 더 많은 후보가 필요합니다. 무시
          # if topic.election_nominations.length < 2
          #   error = I18n.t('election.errors.more_nominations')
          # end

          if !error && topic.election_status === Topic.election_statuses[:poll]
            error = I18n.t('election.errors.incorrect_status')
          end

          if !error
            new_status = DiscourseElections::ElectionTopic.set_status(topic.id, Topic.election_statuses[:poll], true)

            if new_status != Topic.election_statuses[:poll]
              error = I18n.t('election.errors.set_status_failed')
            end
          end
        else
          error = I18n.t('election.error.topic_inaccessible')
        end
      else
        error = I18n.t('election.error.elections_disabled')
      end

      if error
        DiscourseElections::ElectionTopic.moderators(args[:topic_id]).each do |user|
          if user
            SystemMessage.create_from_system_user(user, :error_starting_poll,
                topic_id: args[:topic_id], error: error)
          end
        end
      end
    end
  end
end
