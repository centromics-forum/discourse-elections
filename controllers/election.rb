# frozen_string_literal: true
module DiscourseElections
  class ElectionController < BaseController
    before_action :ensure_is_elections_admin
    before_action :ensure_is_elections_category, only: [:create]

    def create
      params.require(:category_id)
      params.require(:position)
      params.permit(
        #added by etna
        :poll_enabled_stages,
        :poll_current_stage,

        :nomination_message, # 본래의미에서 변경 --> gathering poll options message
        :poll_message,
        :closed_poll_message,
        :self_nomination_allowed,
        :status_banner,
        :status_banner_result_hours,
        :poll_open,
        :poll_open_after,
        :poll_open_after_hours,
        :poll_open_after_nominations,
        :poll_open_time,
        :poll_close,
        :poll_close_after,
        :poll_close_after_hours,
        :poll_close_after_voters,
        :poll_close_time,
      )

      validate_create_time("open") if params[:poll_open] == "true"
      validate_create_time("close") if params[:poll_close] == "true"

      result = DiscourseElections::ElectionTopic.create(current_user, params)

      if result[:error_message]
        render json: failed_json.merge(message: result[:error_message])
      else
        render json: success_json.merge(url: result[:url])
      end
    end

    def update
      params.require(:topic_id)

      topic = Topic.find(params[:topic_id])

      params.require(:category_id)
      params.require(:position)
      params.permit(
        #added by etna
        :poll_enabled_stages,
        :poll_current_stage,

        :nomination_message, # 본래의미에서 변경 --> gathering poll options message
        :poll_message,
        :closed_poll_message,
        :self_nomination_allowed,
        :status_banner,
        :status_banner_result_hours,
        :poll_open,
        :poll_open_after,
        :poll_open_after_hours,
        :poll_open_after_nominations,
        :poll_open_time,
        :poll_close,
        :poll_close_after,
        :poll_close_after_hours,
        :poll_close_after_voters,
        :poll_close_time,
        # NOTE: params 내에 poll 관련 옵션이 JSON으로 인코딩되어 들어 있음. ElectionPost::update 참고
        :content
      )

      validate_create_time("open") if params[:poll_open] == "true"
      validate_create_time("close") if params[:poll_close] == "true"

      begin
        result = DiscourseElections::ElectionTopic.update(topic, params)

      rescue => e
        pp("Error during PostRevisor revise1: #{e.message}")
        pp(e.backtrace.join("\n"))
        raise
      end

      if result[:error_message]
        render json: failed_json.merge(message: result[:error_message])
      else
        render json: success_json.merge(url: result[:url])
      end
    end

    def start_poll
      params.require(:topic_id)

      topic = Topic.find(params[:topic_id])

      # 선거를 실행하려면 더 많은 후보가 필요합니다.
      if topic.election_nominations.length < 2
        raise StandardError.new I18n.t("election.errors.more_nominations")
      end

      new_status = DiscourseElections::ElectionTopic.set_status(params[:topic_id], Topic.election_statuses[:poll])

      if new_status != Topic.election_statuses[:poll]
        result = { error_message: I18n.t("election.errors.set_status_failed") }
      else
        result = { status: new_status }
      end

      render_result(result)

    rescue => e
      pp("Error in start_poll: #{e.message}")
      pp(e.backtrace.join("\n"))
      raise
    end

    def set_poll_current_stage
      topic_id = params.require(:topic_id)
      poll_current_stage = params.require(:poll_current_stage)

      topic = Topic.find(params[:topic_id])
      existing_poll_current_stage = topic.election_poll_current_stage

      if poll_current_stage == existing_poll_current_stage
        raise StandardError.new I18n.t("election.errors.not_changed")
      end

      new_status = DiscourseElections::ElectionTopic.set_election_poll_current_stage(params[:topic_id], poll_current_stage)

      if new_status == nil || new_status == existing_poll_current_stage
        result = { error_message: I18n.t("election.errors.set_election_poll_current_stage_failed") }
      else
        result = { value: new_status }
      end

      #topic.reload

      render_result(result)

    rescue => e
      pp("Error in set_poll_current_stage: #{e.message}")
      pp(e.backtrace.join("\n"))
      raise
    end

    def set_status
      params.require(:topic_id)
      params.require(:status)

      topic = Topic.find(params[:topic_id])
      status = params[:status].to_i
      existing_status = topic.election_status

      if status == existing_status
        raise StandardError.new I18n.t("election.errors.not_changed")
      end

      # 선거를 실행하려면 더 많은 후보가 필요합니다.
      if status != Topic.election_statuses[:nomination] &&
           topic.election_nominations.length < 2

        raise StandardError.new I18n.t("election.errors.more_nominations")
      end

      new_status = DiscourseElections::ElectionTopic.set_status(params[:topic_id], status)

      if new_status == existing_status
        result = { error_message: I18n.t("election.errors.set_status_failed") }
      else
        result = { value: new_status }
      end

      render_result(result)

    rescue => e
      pp("Error in set_status: #{e.message}")
      pp(e.backtrace.join("\n"))
      raise
    end

    def set_status_banner
      params.require(:topic_id)
      params.require(:status_banner)

      topic = Topic.find(params[:topic_id])
      existing_state = topic.custom_fields["election_status_banner"]

      if params[:status_banner].to_s == existing_state.to_s
        raise StandardError.new I18n.t("election.errors.not_changed")
      end

      topic.custom_fields["election_status_banner"] = params[:status_banner]
      topic.save_custom_fields(true)

      DiscourseElections::ElectionCategory.update_election_list(topic.category_id, topic.id, banner: params[:status_banner])

      render_result(value: topic.custom_fields["election_status_banner"])

    rescue => e
      pp("Error in set_status_banner: #{e.message}")
      pp(e.backtrace.join("\n"))
      raise
    end

    def set_status_banner_result_hours
      params.require(:topic_id)
      params.require(:status_banner_result_hours)

      topic = Topic.find(params[:topic_id])
      existing = topic.custom_fields["election_status_banner_result_hours"]

      if params[:status_banner_result_hours].to_i == existing.to_i
        raise StandardError.new I18n.t("election.errors.not_changed")
      end

      topic.custom_fields["election_status_banner_result_hours"] = params[:status_banner_result_hours]
      topic.save_custom_fields(true)

      render_result(
        value: topic.custom_fields["election_status_banner_result_hours"]
      )

    rescue => e
      pp("Error in set_status_banner_result_hours: #{e.message}")
      pp(e.backtrace.join("\n"))
      raise
    end

    def set_self_nomination_allowed
      params.require(:topic_id)
      params.require(:self_nomination_allowed)

      topic = Topic.find(params[:topic_id])
      existing_state = topic.custom_fields["election_self_nomination_allowed"]

      if params[:self_nomination_allowed].to_s == existing_state.to_s
        raise StandardError.new I18n.t(
                                  "election.errors.self_nomination_state_not_changed"
                                )
      end

      response =
        DiscourseElections::Nomination.set_self_nomination(
          params[:topic_id],
          params[:self_nomination_allowed]
        )

      if response == existing_state
        result = {
          error_message:
            I18n.t("election.errors.self_nomination_state_not_changed")
        }
      else
        result = { value: response }
      end

      render_result(result)
    end

    def set_message
      params.require(:topic_id)
      params.permit(:nomination_message, :poll_message, :closed_poll_message)

      type = nil
      message = nil

      params.keys.each do |key|
        if key && key.to_s.include?("message")
          message = params[key]
          parts = key.split("_")
          parts.pop
          type = parts.join("_")
        end
      end

      if type && message &&
           success = DiscourseElections::ElectionTopic.set_message(params[:topic_id], message, type)
        result = { value: message }
      else
        result = { error_message: I18n.t("election.errors.set_message_failed") }
      end

      render_result(result)
    end

    def set_position
      params.require(:topic_id)
      params.require(:position)

      if params[:position].length < 3
        raise StandardError.new I18n.t("election.errors.position_too_short")
      end

      if success = DiscourseElections::ElectionTopic.set_position(params[:topic_id], params[:position])
        result = { value: params[:position] }
      else
        result = {
          error_message: I18n.t("election.errors.set_position_failed")
        }
      end

      render_result(result)
    end

    def set_poll_time
      params.require(:topic_id)
      params.require(:type)
      params.require(:enabled)
      params.permit(:after, :hours, :nominations, :voters, :time)

      enabled = params[:enabled] === "true"
      after = params[:after] === "true"
      hours = params[:hours].to_i
      nominations = params[:nominations].to_i
      voters = params[:voters].to_i
      time = params[:time]
      type = params[:type]

      if enabled
        validate_time(
          type: type,
          after: after,
          hours: hours,
          nominations: nominations,
          voters: voters,
          time: time
        )
      end

      topic = Topic.find(params[:topic_id])

      pp "##################### type #{type}"
      pp "##################### enabled #{enabled}"
      pp "##################### election_nominations #{topic.election_nominations}"
      pp "##################### nominations #{nominations}"
      pp "##################### topic.election_poll_voters #{topic.election_poll_voters}"
      pp "##################### voters #{voters}"

      if type === "open" && enabled && after && topic.election_nominations.length >= nominations
        raise StandardError.new I18n.t("election.errors.nominations_already_met")
      end

      if type === "close" && enabled && after && topic.election_poll_voters >= voters
        raise StandardError.new I18n.t("election.errors.voters_already_met")
      end

      enabled_str = "election_poll_#{type}"
      after_str = "election_poll_#{type}_after"
      hours_str = "election_poll_#{type}_after_hours"
      nominations_str = "election_poll_#{type}_after_nominations"
      voters_str = "election_poll_#{type}_after_voters"
      time_str = "election_poll_#{type}_time"

      topic.custom_fields[enabled_str] = enabled if enabled != topic.send(enabled_str)
      topic.custom_fields[after_str] = after if after != topic.send(after_str)

      if after
        topic.custom_fields[hours_str] = hours if hours != topic.send(hours_str)
        if type === "open" && nominations != topic.send(nominations_str)
          topic.custom_fields[nominations_str] = nominations
        end
        if type === "close" && voters != topic.send(voters_str)
          topic.custom_fields[voters_str] = voters
        end
      else
        topic.custom_fields[time_str] = time if time != topic.send(time_str)
      end

      if saved = topic.save_custom_fields(true)
        if topic.send(enabled_str)
          if (topic.send(after_str))
            DiscourseElections::ElectionTime.send("cancel_scheduled_poll_#{type}", topic)
          else
            DiscourseElections::ElectionTime.send("schedule_poll_#{type}", topic)
          end
        else
          DiscourseElections::ElectionTime.send("cancel_scheduled_poll_#{type}", topic)
        end
      end

      if saved
        result = {}
      else
        result = {
          error_message: I18n.t("election.errors.set_poll_time_failed")
        }
      end

      render_result(result)
    end

    def set_winner
      params.require(:topic_id)

      winner = params[:winner] || ""
      winner_obj = User.find_by(username: winner)

      if winner.present? && winner_obj == nil
        raise "User(#{winner}) not found"
      end

      result =
        DiscourseElections::ElectionTopic.set_winner(params[:topic_id], winner)

      if result[:success]
        result = { value: result[:winner] }
      else
        result = { error_message: I18n.t("election.errors.set_winner_failed") }
      end

      render_result(result)
    end

    def rebuild_election_post
      params.require(:topic_id)

      topic = Topic.find(params[:topic_id])

      if DiscourseElections::ElectionPost.rebuild_election_post(topic, unattended: false)
        result = { value: true }
      else
        result = { error_message: I18n.t("election.errors.rebuild_election_post_failed") }
      end

      render_result(result)
    end 

    private

    def validate_create_time(type)
      validate_time(
        type: type,
        after: params["poll_#{type}_after".to_sym] == "true",
        hours: params["poll_#{type}_after_hours".to_sym].to_i,
        nominations: params["poll_#{type}_after_nominations".to_sym].to_i,
        voters: params["poll_#{type}_after_voters".to_sym].to_i,
        time: params["poll_#{type}_time".to_sym]
      )
    end

    def validate_time(opts)
      if opts[:after]
        if opts[:hours].blank? ||
             (opts[:type] === "open" && opts[:nominations].blank?) ||
             (opts[:type] === "close" && opts[:voters].blank?)
          raise StandardError.new I18n.t("election.errors.poll_after")
        elsif opts[:type] === "open" && opts[:nominations].to_i < 2
          raise StandardError.new I18n.t("election.errors.nominations_at_least_2")
        elsif opts[:type] === "close" && opts[:voters].to_i < 1
          raise StandardError.new I18n.t("election.errors.voters_at_least_1")
        end
      elsif opts[:time].blank?
        raise StandardError.new I18n.t("election.errors.poll_manual")
      else
        begin
          time = Time.parse(opts[:time]).utc
          if time < Time.now.utc
            raise StandardError.new I18n.t("election.errors.time_invalid")
          end
        rescue ArgumentError
          raise StandardError.new I18n.t("election.errors.time_invalid")
        end
      end
    end
  end
end
